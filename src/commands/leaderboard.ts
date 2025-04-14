import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedBuilder, MessagePayload, SlashCommandBuilder } from "discord.js";
import { getRelativeXpForNextLevel } from "../xpMath";
import Command from "../command";
import { InteractionContext } from "../interactionContext";

export function getLeaderboardMessage(ctx: InteractionContext<any>): MessagePayload | BaseMessageOptions | string {
    const res = ctx.db.users.queryLeaderboard(ctx.interaction.guildId!);
    const users = res.value;

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

    if(users.length == 0) {
        lines = [
            ctx.getTranslation({
                en: "No entries yet",
                pl: "Brak wpisów"
            })
        ];
    }

    const heading = "# :trophy: " + ctx.getTranslation({
        en: "Leaderboard",
        pl: "Tablica wyników"
    });

    const embed = new EmbedBuilder()
        .setDescription(`${heading} \n ${lines.join("\n")} \n\n ${res.getCodeBlock()}`)
        .setTimestamp(Date.now())

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(ctx.getComponentId("refresh"))
                .setStyle(ButtonStyle.Primary)
                .setLabel(ctx.getTranslation({
                    en: "Refresh",
                    pl: "Odśwież"
                }))
        )
    
    return {
        embeds: [embed],
        components: [row]
    };
}

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
        ctx.interaction.editReply(getLeaderboardMessage(ctx));
    })
    .addButtonHandler("refresh", (ctx) => {
        ctx.interaction.deferUpdate();
        ctx.interaction.message.edit(getLeaderboardMessage(ctx));
    })