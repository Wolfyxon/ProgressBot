import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("rank")
            .setDescription("Checks your or someone else's rank")
            
            .addUserOption(option => option
                .setName("user")
                .setDescription("User to check the rank of")
                .setRequired(false)
                
            ),
    
    run: async (ctx) => {        
        await ctx.interaction.deferReply();

        const user = ctx.interaction.options.getUser("user") ?? ctx.interaction.user;
        
        const res = ctx.db.queryOrSetupUser(ctx.interaction.guildId!, user.id)
        const dbUser = res.user;

        const xp = dbUser.getLevelXp();
        const reqXp = dbUser.getXpForNextLevel();

        const barWidth = 16;
        const dispXp = Math.floor(barWidth * (xp / reqXp))

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
                        })

        ctx.interaction.editReply({
            content: res.result.getCodeBlock(),
            embeds: [embed]
        });
    }
});