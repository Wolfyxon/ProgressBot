import assert from "assert";
import { ChatInputCommandInteraction, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import * as fs from "fs";
import Database from "./db/database";

export type UniversalCommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export type TranslationTable = {
    [key: string]: string, 
    en: string
};

export class CommandRunContext {
    interaction: ChatInputCommandInteraction;
    db: Database

    private lang?: string

    constructor(interaction: ChatInputCommandInteraction, db: Database) {
        this.interaction = interaction;
        this.db = db;
    }

    public getLang(): string {
        if(this.lang) return this.lang;

        const guild = this.db.guilds.queryOrSetupGuild(this.interaction.guildId!).guild;
        this.lang = guild.language;
        
        return guild.language;
    }

    public getTranslation(translations: TranslationTable): string {
        return translations[this.getLang()] ?? translations.en;
    }
}

const COMMAND_DIR = "src/commands";

export default class Command {
    private run?: (ctx: CommandRunContext) => void;
    public builder?: UniversalCommandBuilder;

    public setRun(callback: (ctx: CommandRunContext) => void): Command {
        this.run = callback;
        return this;
    }

    public setBuilder(builder: UniversalCommandBuilder): Command {
        this.builder = builder;
        return this;
    }

    public execute(interaction: ChatInputCommandInteraction, db: Database) {
        this.run!(new CommandRunContext(interaction, db));
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
    const body = cmds.map(cmd => cmd.builder!.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    await rest.put(
        Routes.applicationGuildCommands(client, guild),
        {
            body: body
        }
    );

    console.log("Command registration successful");
}