import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getRelativeXpForNextLevel } from "../xpMath";
import Command from "../command";

export default new Command()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("leaderboard")
            .setDescription("Shows the best members")
            .setDescriptionLocalizations({
                pl: "Pokazuje najlepszych członków"
            })
    )
    .setRun(async (ctx) => {
        await ctx.interaction.deferReply();

        const res = ctx.db.users.queryLeaderboard(ctx.interaction.guildId!);
        const users = res.value;

        if(users.length == 0) {
            ctx.interaction.editReply("No users are added for this server!");
            return;
        }

        const emojis = [
            ":first_place:",
            ":second_place:",
            ":third_place:"
        ];
        
        let lines = users.map((user, i) => {
            const prefix = emojis[i] ?? "#" + (i + 1);
            const level = user.getLevel();
            const xp = user.getLevelXp();
            const requiredXp = getRelativeXpForNextLevel(level);

            return `${prefix} <@${user.userId}>: Level **${level}** (${xp} / ${requiredXp})`;    
        });

        if(lines.length == 0) {
            lines = [
                ctx.getTranslation({
                    en: "No users to show",
                    pl: "Brak użytkowników do wyświetlenia"
                })
            ];
        }

        const embed = new EmbedBuilder()
            .setTitle(":trophy: Leaderboard")
            .setDescription(lines.join("\n") + res.getCodeBlock())
            .setTimestamp(Date.now())

        ctx.interaction.editReply({
            embeds: [embed]
        });
    });