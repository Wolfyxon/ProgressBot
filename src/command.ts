import assert from "assert";
import { ChatInputCommandInteraction, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import * as fs from "fs";
import Database from "./db/database";

type CommandData = {
    builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
    run: (ctx: CommandRunContext) => void
};

export class CommandRunContext {
    interaction: ChatInputCommandInteraction;
    db: Database

    constructor(interaction: ChatInputCommandInteraction, db: Database) {
        this.interaction = interaction;
        this.db = db;
    }
}

const COMMAND_DIR = "src/commands";

export default class Command {
    public data: CommandData

    constructor(data: CommandData) {
        assert(data.builder.description, "Command description must be specified");
        
        // TODO: Also check options
        
        this.data = data;
    }

    public execute(interaction: ChatInputCommandInteraction, db: Database) {
        this.data.run({
            interaction: interaction,
            db: db
        });
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