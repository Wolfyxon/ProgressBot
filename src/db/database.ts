import { DatabaseSync, StatementSync, StatementResultingChanges } from "node:sqlite";
import Users from "./users";
import Guilds from "./guilds";
import BotContext from "../botContext";
import { cleanStr } from "../utils";
import { QuizManager } from "./quizzes";

export class DbResult<T> {
    statement: StatementSync
    value: T

    constructor(statement: StatementSync, value: T) {
        this.statement = statement;
        this.value = value;
    }

    public getSql(): string {
        return cleanStr(this.statement.expandedSQL);
    }

    public getCodeBlock(): string {
        return "```sql\n" +
                this.getSql() +
                "\n```"
    }
}

export class DbRunResult extends DbResult<StatementResultingChanges> {
    public hasChanges(): boolean {
        return this.value.changes != 0;
    }
}

export default class Database {
    public botCtx: BotContext;
    public db: DatabaseSync;
    public users: Users;
    public guilds: Guilds;
    public quizzes: QuizManager;
    
    constructor(context: BotContext, file?: string) {
        this.botCtx = context;
        this.db = new DatabaseSync(file ?? "data.db");
        this.users = new Users(this);
        this.guilds = new Guilds(this);
        this.quizzes = new QuizManager(this);
    }
    
    public setup() {
        this.users.setup();
        this.guilds.setup();
        this.quizzes.setup();
    }

    public queryAll(sql: string, ...params: any[]): DbResult<any[]> {
        const q = this.db.prepare(sql);
        
        return new DbResult<any[]>(
            q,
            q.all(...params)
        );
    }

    public queryAllAs<T>(sql: string, ...params: any[]): DbResult<T[]> {
        const res = this.queryAll(sql, ...params);

        return new DbResult<T[]> (
            res.statement,
            res.value.map(v => v as T)
        );
    }

    public queryAs<T>(sql: string, ...params: any[]): DbResult<T> {
        const res = this.query(sql, ...params);

        return new DbResult<T> (
            res.statement,
            res.value as T
        );
    }

    public query(sql: string, ...params: any[]): DbResult<any> {
        const q = this.db.prepare(sql);

        return new DbResult<any>(
            q,
            q.get(...params)
        );
    }

    public run(sql: string, ...params: any[]): DbRunResult {
        const q = this.db.prepare(sql);

        return new DbRunResult(
            q,
            q.run(...params)
        );
    }
}