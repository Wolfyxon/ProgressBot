import { EmbedBuilder, InteractionDeferReplyOptions, MessageFlags, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("rank")
            .setDescription("Checks your or someone else's rank")
            
            .addUserOption(o => o
                .setName("user")
                .setDescription("User to check the rank of")
                .setRequired(false)
            )
            .addBooleanOption(o => o
                .setName("ephemeral")
                .setDescription("Should the rank be shown to everyone in the channel")
                .setRequired(false)
            ),
    
    run: async (ctx) => {
        const user = ctx.interaction.options.getUser("user") ?? ctx.interaction.user;
        const ephemeral = ctx.interaction.options.getBoolean("ephemeral");
        
        let options: InteractionDeferReplyOptions = {};

        if(ephemeral) {
            options.flags = MessageFlags.Ephemeral;
        }

        await ctx.interaction.deferReply(options);

        const res = ctx.db.users.queryOrSetupUser(ctx.interaction.guildId!, user.id)
        const dbUser = res.user;

        const xp = dbUser.getLevelXp();
        const reqXp = dbUser.getXpForNextLevel();

        const barWidth = 16;
        const dispXp = Math.floor(barWidth * (xp / reqXp));

        let bar = "🟩".repeat(dispXp) + "⬛".repeat(barWidth - dispXp);

        const embed = new EmbedBuilder()
                        .setAuthor({
                            name: user.displayName,
                            iconURL: user.avatarURL() ?? ""
                        })
                        .setTitle(`Level ${dbUser.getLevel()}`)
                        .setThumbnail(user.avatarURL())
                        .setDescription(`${bar} ${xp}/${reqXp}`)
                        .setFooter({
                            text: `@${user.tag} | ${user.id}`
                        });

        ctx.interaction.editReply({
            content: res.result.getCodeBlock(),
            embeds: [embed]
        });
    }
});