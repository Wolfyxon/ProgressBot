import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { getCommands } from "./command";
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
            GatewayIntentBits.GuildVoiceStates
        ]
    });
    
    client.once(Events.ClientReady, () => {
        console.log(`Logged in successfully as ${client.user?.tag}`);
    });

    client.on(Events.InteractionCreate, interaction => {
        if (!interaction.isChatInputCommand()) return;

        for(const cmd of commands) {
            if(cmd.builder!.name == interaction.commandName) {
                cmd.execute(interaction, botCtx);
                break;
            }
        }
    });
    
    botCtx.config = config;
    botCtx.client = client;
    botCtx.db = db;

    client.login(TOKEN);
}

main();