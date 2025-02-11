import { DatabaseSync } from "node:sqlite";

const TBL_USERS = "Users";

export type DbUser = {
    userId: string,
    guildId: string,
    xp: number,
    level: number
}

export default class Database {
    public db: DatabaseSync;
    
    constructor(file?: string) {
        this.db = new DatabaseSync(file ?? "data.db");
    }

    public setup() {
        this.db.exec(`

        CREATE TABLE IF NOT EXISTS ${TBL_USERS} (
            userId VARCHAR(20) NOT NULL,
            guildId VARCHAR(20) NOT NULL,
            xp INTEGER NOT NULL DEFAULT 0,
            level INTEGER NOT NULL DEFAULT 1,
            
            UNIQUE (user_id, guild_id)
        )

        `);
    }

    public getGuildUsers(guild: string): DbUser[] {
        return this.db.prepare(`
            SELECT * FROM ${TBL_USERS} WHERE guild_id = ?
        `).all(guild) as DbUser[];
    }

    public getGuildUser(guild: string, user: string): DbUser {
        return this.db.prepare(`
        SELECT * FROM ${TBL_USERS} WHERE guild_id = ? AND user_id = ?
        `).get(guild, user) as DbUser;
    }

    public addUser(guild: string, user: string) {
        const query = this.db.prepare(`
            INSERT INTO ${TBL_USERS} (userId, guildId) VALUES (?, ?)
        `);

        query.run(user, guild);
    }
}