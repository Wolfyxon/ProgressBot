import { CommandInteraction, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
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

export async function registerGuildCommands(client: string, guild: string) {
    console.log(`Deploying commands in guild: ${guild}...`);
    
    const cmds = await getCommands();
    const body = cmds.map(cmd => cmd.data.builder.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    await rest.put(
        Routes.applicationGuildCommands(client, guild),
        {
            body: body
        }
    );

    console.log("Command registration successful");
}