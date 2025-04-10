import { ChatInputCommandInteraction, Interaction } from "discord.js";
import Database from "./db/database";
import { DbGuild } from "./db/guilds";
import BotContext from "./botContext";

export type TranslationTable = {
    [key: string]: string, 
    en: string
};

export class CommandContext {
    interaction: Interaction;
    botCtx: BotContext;
    db: Database;

    private lang?: string;
    private dbGuild?: DbGuild;

    constructor(interaction: Interaction, botCtx: BotContext) {
        this.interaction = interaction;
        this.botCtx = botCtx;
        this.db = botCtx.db!;
    }

    public getDbGuild(): DbGuild {
        if(this.dbGuild) {
            return this.dbGuild;
        }

        const guild = this.db.guilds.queryOrSetupGuild(this.interaction.guildId!).guild;
        this.dbGuild =  guild;

        return guild;
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

    constructor(interaction: ChatInputCommandInteraction, botCtx: BotContext) {
        super(interaction, botCtx);
        this.interaction = interaction;
    }
}
