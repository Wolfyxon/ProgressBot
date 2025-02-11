import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("leaderboard")
            .setDescription("Shows the best members"),
    
    run: async (ctx) => {
        await ctx.interaction.deferReply();

        const users = ctx.db.getLeaderboard(ctx.interaction.guildId!);
        
        if(users.length == 0) {
            ctx.interaction.editReply("No users are added for this server!");
            return;
        }

        const emojis = [
            ":first_place:",
            ":second_place:",
            ":third_place:"
        ];
        
        const description = users.map((user, i) => {
            return `${emojis[i] ?? "#" + (i + 1)} <@${user.userId}>`;    
        });

        const embed = new EmbedBuilder()
            .setTitle(":trophy: Leaderboard")
            .setDescription(description.join("\n"))

        ctx.interaction.editReply({
            embeds: [embed]
        });
    }
});