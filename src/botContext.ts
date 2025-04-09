import { Client } from "discord.js";
import Database from "./db/database";

export default class BotContext {
    client?: Client;
    db?: Database;
}