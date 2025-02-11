import { DatabaseSync } from "node:sqlite";
import { getLevel, getTotalXpForLevel } from "./xpMath";

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
    db: Database

    constructor(data: RawDbUser, db: Database) {
        this.userId = data.userId;
        this.guildId = data.guildId;
        this.xp = data.xp;
        this.db = db;
    }

    public getLevel(): number {
        return getLevel(this.xp);
    }

    public getLevelXp(): number {
        return this.xp - getTotalXpForLevel(this.getLevel());
    }

    public submit() {
        this.db.db.prepare(`
            INSERT OR REPLACE INTO ${TBL_USERS} (userId, guildId, xp) VALUES (?, ?, ?)
        `).run(this.userId, this.guildId, this.xp);
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
            
            UNIQUE (userId, guildId)
        )

        `);
    }

    public getGuildUsers(guild: string): DbUser[] {
        return this.db.prepare(`
            SELECT * FROM ${TBL_USERS} WHERE guildId = ?
        `).all(guild).map((raw) => new DbUser(raw as RawDbUser, this));
    }

    public getLeaderboard(guild: string, length?: number): DbUser[] {
        return this.db.prepare(`
            SELECT * FROM ${TBL_USERS} WHERE guildId = ? ORDER BY xp DESC LIMIT ${length ?? 20} 
        `).all(guild).map((raw) => new DbUser(raw as RawDbUser, this));
    }

    public getGuildUser(guild: string, user: string): DbUser | null {
        const raw = this.db.prepare(`
        SELECT * FROM ${TBL_USERS} WHERE guildId = ? AND userId = ?
        `).get(guild, user) as RawDbUser;

        if(!raw) return null;

        return new DbUser(raw, this);
    }

    public getOrSetupGuildUser(guild: string, user: string): DbUser {
        const usr = this.getGuildUser(guild, user);

        if(!usr) {
            this.setupUser(guild, user);
            return this.getGuildUser(guild, user)!;
        }

        return usr;
    }

    public getOrTemplateGuildUser(guild: string, user: string): DbUser {
        const usr = this.getGuildUser(guild, user);

        if(usr) return usr;

        return new DbUser({
            userId: user,
            guildId: guild,
            xp: 0
        }, this);
    }

    public setupUser(guild: string, user: string) {
        const query = this.db.prepare(`
            INSERT OR IGNORE INTO ${TBL_USERS} (userId, guildId) VALUES (?, ?)
        `);

        query.run(user, guild);
    }

    public userExists(guild: string, user: string) {
        return this.getGuildUser(guild, user) != null;
    }
}