import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { getCommands, registerGuildCommands } from "./command";
import Database from "./database";

console.log("Welcome to ProgressBot");
console.log("https://github.com/Wolfyxon/ProgressBot");

dotenv.config();

const TOKEN: string = process.env["DISCORD_TOKEN"]!;

async function main() {
    const commands = await getCommands();

    const db = new Database();
    db.setup();


    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds
        ]
    });
    
    client.once(Events.ClientReady, () => {
        console.log(`Logged in successfully as ${client.user?.tag}`);
    });

    client.on(Events.InteractionCreate, interaction => {
        if (!interaction.isChatInputCommand()) return;

        for(const cmd of commands) {
            if(cmd.data.builder.name == interaction.commandName) {
                cmd.execute(interaction, db);
                break;
            }
        }
    });
    
    client.login(TOKEN);
}

main();