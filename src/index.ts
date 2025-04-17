import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { getButtonHandlerById, getCommandByName, getCommands } from "./command";
import Database from "./db/database";
import BotContext from "./botContext";
import { getConfig } from "./config";

console.log("Welcome to ProgressBot");
console.log("https://github.com/Wolfyxon/ProgressBot");

dotenv.config();

const TOKEN: string = process.env["DISCORD_TOKEN"]!;

async function main() {
    const commands = await getCommands();

    const config = getConfig();
    const botCtx = new BotContext();

    const db = new Database(botCtx);
    db.setup();

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.MessageContent
        ]
    });
    
    client.once(Events.ClientReady, () => {
        console.log(`Logged in successfully as ${client.user?.tag}`);

        db.cleanup();
    });

    client.on(Events.InteractionCreate, interaction => {
        if(interaction.isChatInputCommand()) {
            const cmd = getCommandByName(commands, interaction.commandName);

            if(cmd) {
                cmd.execute(interaction, botCtx);
            } else {
                interaction.reply(":x: This command isn't implemented. \n**This is a bug, contact Wolfyxon!**");
            }

        } else if(interaction.isButton()) {
            if(interaction.replied) return;

            const handler = getButtonHandlerById(commands, interaction.customId);

            if(handler) {
                handler.execute(interaction, botCtx);
            }
        }
    });
    
    botCtx.config = config;
    botCtx.client = client;
    botCtx.db = db;

    client.login(TOKEN);
}

main();