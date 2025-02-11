import { CommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
import * as fs from "fs";

type CommandData = {
    builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    run: (ctx: CommandRunContext) => void
};

// Add more fields if needed in the future
type CommandRunContext = {
    interaction: CommandInteraction
}

const COMMAND_DIR = "src/commands";

export default class Command {
    public data: CommandData

    constructor(data: CommandData) {
        this.data = data;
    }
}

export async function getCommands(): Promise<Command[]> {
    return await Promise.all(fs.readdirSync(COMMAND_DIR).map(async (file: string) => {
        const module = await import(`../${COMMAND_DIR}/${file}`);

        return module.default as Command;
    }));
}