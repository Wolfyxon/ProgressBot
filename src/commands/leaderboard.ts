import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getRelativeXpForNextLevel } from "../xpMath";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("leaderboard")
            .setDescription("Shows the best members"),
    
    run: async (ctx) => {
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
        
        const description = users.map((user, i) => {
            const prefix = emojis[i] ?? "#" + (i + 1);
            const level = user.getLevel();
            const xp = user.getLevelXp();
            const requiredXp = getRelativeXpForNextLevel(level);

            return `${prefix} <@${user.userId}>: Level **${level}** (${xp} / ${requiredXp} )`;    
        });

        const embed = new EmbedBuilder()
            .setTitle(":trophy: Leaderboard")
            .setDescription(description.join("\n"))

        ctx.interaction.editReply({
            content: res.getCodeBlock(),
            embeds: [embed]
        });
    }
});