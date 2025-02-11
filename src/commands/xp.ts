import { SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("xp")
            .setDescription("Manage user XP")
            
            .addSubcommand(cmd => 
                cmd
                    .setName("add")
                    .setDescription("Add XP")

                    .addUserOption(option =>
                        option
                            .setName("user")
                            .setDescription("User to add XP to")
                            .setRequired(true)
                    )
                    .addNumberOption(option => 
                        option
                            .setName("amount")
                            .setDescription("Amount of XP to add")
                            .setRequired(true)
                    )
            ),
    
    run: async (ctx) => {
        await ctx.interaction.deferReply();

        switch (ctx.interaction.options.getSubcommand(true)) {
            case "add": {
                const amount = ctx.interaction.options.getNumber("amount", true);
                const user = ctx.interaction.options.getUser("user", true);
                
                const dbUser = ctx.db.getOrTemplateGuildUser(ctx.interaction.guildId!, user.id);
                dbUser.xp += amount;

                dbUser.submit();

                ctx.interaction.editReply(`Added ${amount} XP to ${ctx.interaction.user.displayName}`);

                break;
            }

            default: {
                ctx.interaction.editReply("The bot pooped itself");
            }
        }
    }
});