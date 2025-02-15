import Database, { DbResult, DbRunResult } from "./database";
import { getLevel, getTotalXpForLevel, getRelativeXpForNextLevel } from "../xpMath";
import DbTable from "./table";
import assert from "assert";

type RawDbUser = {
    userId: string,
    guildId: string,
    xp: number
}

export class DbUser {
    userId: string = "";
    guildId: string = ""
    xp: number = 1
    tbl: Users

    constructor(data: RawDbUser, tbl: Users) {
        this.tbl = tbl;
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
        return this.tbl.userExists(this.guildId, this.userId);
    }

    public queryRank(): DbResult<number | null> {
        const res = this.tbl.db.query(
            `SELECT RANK() OVER(
                ORDER BY xp DESC
            ) rank 
            FROM ${this.tbl.name}
            WHERE userId = ? AND guildId = ? 
            `,
            this.userId, this.guildId
        );

        if(!res.value) return res;

        return new DbResult<number>(
            res.statement,
            res.value.rank!
        )
    }

    public submit() {
        this.tbl.db.db.prepare(`
            INSERT OR REPLACE INTO ${this.tbl.name} (userId, guildId, xp) VALUES (?, ?, ?)
        `).run(this.userId, this.guildId, this.xp);
    }

    public reload() {
        const res = this.tbl.queryRawUser(this.guildId, this.userId);
        assert(res.value, `Reload failed: User ${this.guildId}:${this.userId} doesn't exist in the database`);

        this.loadData(res.value);
    }
} 

export default class Users extends DbTable {
    constructor(db: Database) {
        super("Users", db);
    }

    public setup(): void {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                userId VARCHAR(20) NOT NULL,
                guildId VARCHAR(20) NOT NULL,
                xp INTEGER NOT NULL DEFAULT 0,
                
                UNIQUE (userId, guildId)
            )
        `);
    }

    public queryAllInGuild(guild: string): DbResult<DbUser[]> {
        const res = this.db.queryAll(`SELECT * FROM ${this.name} WHERE guildId = ?`, guild);

        return new DbResult<DbUser[]> (
            res.statement,
            res.value.map((raw) => new DbUser(raw as RawDbUser, this))
        );
    }

    public queryUser(guild: string, user: string): DbResult<DbUser | null> {
        const res = this.queryRawUser(guild, user);

        if(!res.value) return new DbResult<DbUser | null>(
            res.statement,
            res.value
        );

        return new DbResult<DbUser>(
            res.statement,
            new DbUser(res.value as RawDbUser, this)
        );
    }

    public queryRawUser(guild: string, user: string): DbResult<RawDbUser | null> {
        return this.db.query(`
            SELECT * FROM ${this.name} WHERE guildId = ? AND userId = ?
        `, guild, user);
    }

    public queryLeaderboard(guild: string, length?: number): DbResult<DbUser[]> {
        const res = this.db.queryAll(`
            SELECT * FROM ${this.name} WHERE guildId = ? ORDER BY xp DESC LIMIT ${length ?? 20} 
        `, guild);

        return new DbResult<DbUser[]>(
            res.statement,
            res.value.map((raw) => new DbUser(raw as RawDbUser, this))
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

        const query = this.queryUser(guild, user);

        return {
            user: query.value as DbUser,
            result: query as DbResult<DbUser>
        }
    }

    public getUserOrNull(guild: string, user: string): DbUser | null {
        const res = this.queryUser(guild, user);
        
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
        return this.db.run(`
            INSERT OR IGNORE INTO ${this.name} (userId, guildId) VALUES (?, ?)
        `, user, guild);
    }

    public userExists(guild: string, user: string) {
        return this.getUserOrNull(guild, user) != null;
    }
}