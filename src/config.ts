import * as fs from "fs";

const CONFIG_PATH = "config.json";

export type ConfigData = {
    developers: string[]
}

export class Config {
    data: ConfigData;

    constructor(data: ConfigData) {
        this.data = data;
    }

    public isDev(userId: string): boolean {
        return this.data.developers.includes(userId);
    }
}

export function defaultConfig(): Config {
    return new Config({
        developers: []
    });
}

export function getConfig(): Config {
    if (!fs.existsSync(CONFIG_PATH)) {
        return defaultConfig();
    }

    try {
        const text = fs.readFileSync(CONFIG_PATH).toString();
        const res = JSON.parse(text) as ConfigData;
        
        return new Config(res);
    } catch (e) {
        console.error(`Failed to read config from ${CONFIG_PATH}, using default config.\n${e}`);
        return defaultConfig();
    }
}