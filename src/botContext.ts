import { Channel, Client, TextChannel } from "discord.js";
import Database from "./db/database";
import { Config } from "./config";

export default class BotContext {
    config?: Config;
    client?: Client;
    db?: Database;

    public async getChannel(id: string): Promise<Channel | null> {
        try {
            return await this.client!.channels.fetch(id);
        } catch {
            return new Promise(res => res(null));
        }
    }
}