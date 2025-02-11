import { DatabaseSync } from "node:sqlite";
import { getLevel } from "./xpMath";

const TBL_USERS = "Users";

type RawDbUser = {
    userId: string,
    guildId: string,
    xp: number
}

export class DbUser {
    userId: string
    guildId: string
    xp: number

    constructor(data: RawDbUser) {
        this.userId = data.userId;
        this.guildId = data.guildId;
        this.xp = data.xp;
    }

    public getLevel(): number {
        return getLevel(this.xp);
    }
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
            
            UNIQUE (user_id, guild_id)
        )

        `);
    }

    public getGuildUsers(guild: string): DbUser[] {
        return this.db.prepare(`
            SELECT * FROM ${TBL_USERS} WHERE guild_id = ?
        `).all(guild).map((raw) => new DbUser(raw as RawDbUser));
    }

    public getGuildUser(guild: string, user: string): DbUser | null {
        const raw = this.db.prepare(`
        SELECT * FROM ${TBL_USERS} WHERE guild_id = ? AND user_id = ?
        `).get(guild, user) as RawDbUser;

        if(!raw) return null;

        return new DbUser(raw);
    }

    public addUser(guild: string, user: string) {
        const query = this.db.prepare(`
            INSERT INTO ${TBL_USERS} (userId, guildId) VALUES (?, ?)
        `);

        query.run(user, guild);
    }

    public userExists(guild: string, user: string) {
        return this.getGuildUser(guild, user) != null;
    }
}