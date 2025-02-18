import { DatabaseSync, StatementSync, StatementResultingChanges } from "node:sqlite";
import { EmbedBuilder } from "discord.js";
import Users from "./users";
import Guilds from "./guilds";

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

export default class Database {
    public db: DatabaseSync;
    public users: Users;
    public guilds: Guilds;
    
    constructor(file?: string) {
        this.db = new DatabaseSync(file ?? "data.db");
        this.users = new Users(this);
        this.guilds = new Guilds(this);
    }
    
    public setup() {
        this.users.setup();
        this.guilds.setup();
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
}