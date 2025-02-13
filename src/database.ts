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
    public hasChanges(): boolean {
        return this.value.changes != 0;
    }
}

type RawDbUser = {
    userId: string,
    guildId: string,
    xp: number
}

export class DbUser {
    userId: string = "";
    guildId: string = ""
    xp: number = 1
    db: Database

    constructor(data: RawDbUser, db: Database) {
        this.db = db;
        this.loadData(data);
    }

    public loadData(data: RawDbUser) {
        this.userId = data.userId;
        this.guildId = data.guildId;
        this.xp = data.xp;
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

    public existsInDb(): boolean {
        return this.db.userExists(this.guildId, this.userId);
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

    public queryRawGuildUser(guild: string, user: string): DbResult<RawDbUser | null> {
        return this.query(`
            SELECT * FROM ${TBL_USERS} WHERE guildId = ? AND userId = ?
        `, guild, user);
    }

    public queryGuildUser(guild: string, user: string): DbResult<DbUser | null> {
        const res = this.queryRawGuildUser(guild, user);
        
        if(!res.value) return new DbResult<DbUser | null>(
            res.statement,
            res.value
        );

        return new DbResult<DbUser>(
            res.statement,
            new DbUser(res.value as RawDbUser, this)
        );
    }

    public queryOrSetupUser(guild: string, user: string): { user: DbUser, result: DbResult<DbUser> | DbRunResult } {
        const setup = this.setupUser(guild, user);

        if(setup.hasChanges()) {
            return {
                user: new DbUser({
                    userId: user,
                    guildId: guild,
                    xp: 0
                }, this),

                result: setup
            }
        }

        const query = this.queryGuildUser(guild, user);

        return {
            user: query.value as DbUser,
            result: query as DbResult<DbUser>
        }
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