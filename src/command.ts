import * as fs from "fs";
import { ButtonInteraction, ChatInputCommandInteraction, MessageFlags, REST, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { CommandButtonContext, CommandRunContext, getComponentId } from "./commandContext";
import BotContext from "./botContext";

export type UniversalCommandBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
export type CommandRunCallback = (ctx: CommandRunContext) => void;
export type CommandButtonCallback = (ctx: CommandButtonContext) => void;

const COMMAND_DIR = "src/commands";

export default class Command {
    private run?: CommandRunCallback;
    private buttonHandlers: CommandButtonHandler[] = [];

    public builder?: UniversalCommandBuilder;
    public teacherOnly: boolean = false;
    public devOnly = false;

    public getName(): string {
        return this.builder!.name;
    }

    public getButtonHandlerById(buttonId: string): CommandButtonHandler | null {
        for(const h of this.buttonHandlers) {
            if(h.getButtonId() == buttonId) {
                return h;
            }
        }
        
        return null;
    }

    public getButtonHandlerByName(buttonName: string): CommandButtonHandler | null {
        for(const h of this.buttonHandlers) {
            if(h.name == buttonName) {
                return h;
            }
        }
        
        return null;
    }

    public makeTeacherOnly(): this {
        this.teacherOnly = true;
        return this;
    }

    public makeDevOnly(): this {
        this.devOnly = true;
        return this;
    }

    public setRun(callback: CommandRunCallback): this {
        this.run = callback;
        return this;
    }

    public setBuilder(builder: UniversalCommandBuilder): this {
        this.builder = builder;
        return this;
    }

    public addButtonHandler(name: string, callback: CommandButtonCallback): this {
        this.buttonHandlers.push(
            new CommandButtonHandler(name, this, callback)
        );
        
        return this;
    }

    public execute(interaction: ChatInputCommandInteraction, ctx: BotContext) {
        const commandCtx = new CommandRunContext(this, interaction, ctx);

        if(this.devOnly && !ctx.config!.isDev(interaction.user.id)) {
            interaction.reply({
                content: ":x: " + commandCtx.getTranslation({
                    en: "You're not a developer",
                    pl: "Nie jesteś deweloperem"
                }),

                flags: MessageFlags.Ephemeral
            });
            
            return;
        }

        if(this.teacherOnly) {
            const guild = ctx.db!.guilds.queryOrSetupGuild(interaction.guildId!).guild;

            if(!guild.isTeacher(interaction.member!)) {
                interaction.reply({
                    content: ":x: " + commandCtx.getTranslation({
                        en: "You're not a teacher",
                        pl: "Nie jesteś nauczycielem"
                    }),
                    
                    flags: MessageFlags.Ephemeral
                });

                return;
            }
        }

        this.run!(commandCtx);
    }
}

export class CommandButtonHandler {
    name: string;
    callback: CommandButtonCallback;
    command: Command;

    constructor(name: string, command: Command, callback: CommandButtonCallback) {
        this.name = name;
        this.callback = callback;
        this.command = command;
    }

    public execute(interaction: ButtonInteraction, botCtx: BotContext) {
        this.callback(
            new CommandButtonContext(this.command, interaction, botCtx)
        );
    }
    
    public getButtonId(): string {
        return getComponentId(this.command.getName(), this.name);
    }
}

export function getButtonHandlerById(commands: Command[], id: string): CommandButtonHandler | null {
    for(const cmd of commands) {
        const h = cmd.getButtonHandlerById(id);
        
        if(h) {
            return h;
        }
    }

    return null;
}

export function getCommandByName(commands: Command[], name: string): Command | null {
    for(const cmd of commands) {
        if(cmd.getName() == name) {
            return cmd;
        }
    }

    return null;
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