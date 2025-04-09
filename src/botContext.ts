import { Client } from "discord.js";
import Database from "./db/database";
import { Config } from "./config";

export default class BotContext {
    config?: Config;
    client?: Client;
    db?: Database;
}