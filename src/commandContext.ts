import { ChatInputCommandInteraction, Interaction } from "discord.js";
import Database from "./db/database";
import { DbGuild } from "./db/guilds";

export type TranslationTable = {
    [key: string]: string, 
    en: string
};

export class CommandContext {
    interaction: Interaction;
    db: Database;

    private lang?: string

    constructor(interaction: Interaction, db: Database) {
        this.interaction = interaction;
        this.db = db;
    }

    public getDbGuild(): DbGuild {
        return this.db.guilds.queryOrSetupGuild(this.interaction.guildId!).guild;
    }

    public getLang(): string {
        if(this.lang) return this.lang;

        const guild = this.getDbGuild();
        this.lang = guild.language;
        
        return guild.language;
    }

    public getTranslation(translations: TranslationTable): string {
        return translations[this.getLang()] ?? translations.en;
    }
}

export class CommandRunContext extends CommandContext {
    interaction: ChatInputCommandInteraction;

    constructor(interaction: ChatInputCommandInteraction, db: Database) {
        super(interaction, db);
        this.interaction = interaction;
    }
}
