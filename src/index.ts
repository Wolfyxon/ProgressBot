import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

console.log("Welcome to ProgressBot");
console.log("https://github.com/Wolfyxon/ProgressBot");

dotenv.config();

const TOKEN: string = process.env["DISCORD_TOKEN"]!;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`Logged in successfully as ${client.user?.tag}`);
});

client.login(TOKEN);