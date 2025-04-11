import { SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("say")
            .setDescription("Repeats text")
            .addStringOption(opt => opt
                .setName("text")
                .setDescription("Text to repeat")
                .setRequired(true)
            )
    )
    .setRun(async (ctx) => {
        const msg = ctx.interaction.options.get("text")!.value as string;

        ctx.interaction.reply(msg);
    });