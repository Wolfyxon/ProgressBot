import { Channel, Client, Message, TextChannel } from "discord.js";
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

    public async getTextChannel(id: string): Promise<Channel | null> {
        const channel = await this.getChannel(id);
        
        if(channel && channel.isTextBased()) {
            return channel;
        } else {
            return null;
        }
    }

    public async getMessageInChannel(channel: TextChannel, id: string): Promise<Message | null> {
        try {
            return await channel.messages.fetch(id);
        } catch {
            return new Promise(res => res(null));
        }
    }
}