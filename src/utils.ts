import { BaseMessageOptions, MessageEditOptions } from "discord.js";

export function limitStr(str: string, charLimit: number): string {
    const suffix = "...";
    const trimmed = str.substring(0, charLimit - suffix.length);
    
    if(trimmed.length != str.length) {
        return trimmed.trimEnd() + suffix;
    }

    return str;
}

// TODO: Handle words longer than the lineLength
export function wordWrap(str: string, lineLength: number): string {
    let lines: string[] = [];
    let line = "";

    str.split(" ").forEach((word) => {
        if(line.length >= lineLength) {
            lines.push(line);
            line = "";
        }

        line += word + " ";
    });

    return lines.join("\n");
}

export function parseJsonOrNull(json: string): Object | null {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function trimMessageJson(data: BaseMessageOptions | MessageEditOptions): BaseMessageOptions {
    let content = data.content;
    
    if(content === null) {
        content = undefined;
    }

    return {
        content: content,
        embeds: data.embeds,
        components: data.components
    }
}

export function cleanStr(str: string): string {
    return str.replace(/\s+/g,' ').trim();
}

export async function wait(sec: number): Promise<undefined> {
    return new Promise(res => {
        setTimeout(res, sec * 1000);
    });
}
