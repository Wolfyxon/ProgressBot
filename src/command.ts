import { CommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

type CommandData = {
    builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    run: (interaction: CommandInteraction) => void
};

export default class Command {
    public data: CommandData

    constructor(data: CommandData) {
        this.data = data;
    }
}