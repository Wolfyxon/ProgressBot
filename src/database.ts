import { DatabaseSync, StatementSync, StatementResultingChanges } from "node:sqlite";
import { getLevel, getRelativeXpForNextLevel, getTotalXpForLevel } from "./xpMath";
import { EmbedBuilder } from "discord.js";

const TBL_USERS = "Users";

export class DbResult<T> {
    statement: StatementSync
    value: T

    constructor(statement: StatementSync, value: T) {
        this.statement = statement;
        this.value = value;
    }

    public getSql(): string {
        return this.statement.expandedSQL.trim();
    }

    public getCodeBlock(): string {
        return "```sql\n" +
                this.getSql() +
                "\n```"
    }

    public getEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("SQL Code")
            .setDescription(this.getCodeBlock())
    }
}

export class DbRunResult extends DbResult<StatementResultingChanges> {

}

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

    public getXpForNextLevel(): number {
        return getRelativeXpForNextLevel(this.getLevel());
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

    public queryAll(sql: string, ...params: string[]): DbResult<any[]> {
        const q = this.db.prepare(sql);
        
        return new DbResult<any[]>(
            q,
            q.all(...params)
        );
    }

    public query(sql: string, ...params: string[]): DbResult<any> {
        const q = this.db.prepare(sql);

        return new DbResult<any>(
            q,
            q.get(...params)
        );
    }

    public run(sql: string, ...params: string[]): DbRunResult {
        const q = this.db.prepare(sql);

        return new DbRunResult(
            q,
            q.run(...params)
        );
    }

    public queryGuildUsers(guild: string): DbResult<DbUser[]> {
        const res = this.queryAll(`SELECT * FROM ${TBL_USERS} WHERE guildId = ?`, guild);

        return new DbResult<DbUser[]> (
            res.statement,
            res.value.map((raw) => new DbUser(raw as RawDbUser, this))
        );
    }

    public queryLeaderboard(guild: string, length?: number): DbResult<DbUser[]> {
        const res = this.queryAll(`
            SELECT * FROM ${TBL_USERS} WHERE guildId = ? ORDER BY xp DESC LIMIT ${length ?? 20} 
        `, guild);

        return new DbResult<DbUser[]>(
            res.statement,
            res.value.map((raw) => new DbUser(raw as RawDbUser, this))
        )
    }

    public queryGuildUser(guild: string, user: string): DbResult<DbUser | null> {
        const res = this.query(`
            SELECT * FROM ${TBL_USERS} WHERE guildId = ? AND userId = ?
        `, guild, user);
        
        if(!res.value) return res;

        return new DbResult<DbUser>(
            res.statement,
            new DbUser(res.value as RawDbUser, this)
        );
    }

    public getUserOrNull(guild: string, user: string): DbUser | null {
        const res = this.queryGuildUser(guild, user);
        
        return res.value;
    }

    public getUser(guild: string, user: string): DbUser {
        const usr = this.getUserOrNull(guild, user);

        if(usr) return usr;

        return new DbUser({
            userId: user,
            guildId: guild,
            xp: 0
        }, this);
    }

    public setupUser(guild: string, user: string): DbRunResult {
        return this.run(`
            INSERT OR IGNORE INTO ${TBL_USERS} (userId, guildId) VALUES (?, ?)
        `, user, guild);
    }

    public userExists(guild: string, user: string) {
        return this.getUserOrNull(guild, user) != null;
    }
}