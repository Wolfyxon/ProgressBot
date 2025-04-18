import { ButtonInteraction, ChatInputCommandInteraction, Interaction, ModalSubmitInteraction } from "discord.js";
import { DbGuild } from "./db/guilds";
import Database from "./db/database";
import BotContext from "./botContext";
import Command from "./command";

export type TranslationTable = {
    [key: string]: string, 
    en: string
};

export class InteractionContext<T extends Interaction> {
    command: Command;
    interaction: T;
    botCtx: BotContext;
    db: Database;

    private lang?: string;
    private dbGuild?: DbGuild;

    constructor(command: Command, interaction: T, botCtx: BotContext) {
        this.command = command;
        this.interaction = interaction;
        this.botCtx = botCtx;
        this.db = botCtx.db!;
    }

    public getComponentId(name: string): string {
        return getComponentId(this.command.getName(), name);
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

    public async awaitModalSubmit(id: string): Promise<ModalSubmitInteraction> {
        if(!this.interaction.isButton() && !this.interaction.isCommand()) {
            throw "Modals not supported for this interaction";
        }
        
        return await this.interaction.awaitModalSubmit({
            filter: i =>
                i.customId == id &&
                i.user.id == this.interaction.user.id,
            time: (60 * 1000) * 15
        })
    }
}

export class CommandRunContext extends InteractionContext<ChatInputCommandInteraction> {}
export class CommandButtonContext extends InteractionContext<ButtonInteraction> {}

export function getComponentId(commandName: string, componentName: string): string {
    return `${commandName}_${componentName}`;
}
