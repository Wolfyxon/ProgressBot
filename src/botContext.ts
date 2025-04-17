import { Channel, Client, Message, TextBasedChannel, TextChannel } from "discord.js";
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

    public async getTextChannel(id: string): Promise<TextBasedChannel | null> {
        const channel = await this.getChannel(id);
        
        if(channel && channel.isTextBased()) {
            return channel;
        } else {
            return null;
        }
    }

    public async getMessageInChannel(channel: TextBasedChannel, id: string): Promise<Message | null> {
        try {
            return await channel.messages.fetch(id);
        } catch {
            return new Promise(res => res(null));
        }
    }

    public async getMessage(channelId: string, messageId: string): Promise<Message | null> {
        const channel = await this.getTextChannel(channelId);
        if(!channel) return null;

        return await this.getMessageInChannel(channel, messageId);
    }
}