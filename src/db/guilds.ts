import Database, { DbResult } from "./database";
import DbTable from "./table";

export type RawDbGuild = {
    guildId: string,
    language: string,
    teacherRoleId?: string
}

export class DbGuild {
    tbl: Guilds;
    guildId: string = "";
    language: string = "en";
    teacherRoleId?: string;

    constructor(data: RawDbGuild, table: Guilds) {
        this.tbl = table;
        this.loadData(data);
    }

    public loadData(data: RawDbGuild) {
        this.guildId = data.guildId;
        this.language = data.language;
        this.teacherRoleId = data.teacherRoleId;
    }
} 

export default class Guilds extends DbTable {
    constructor(db: Database) {
        super("Guilds", db);
    }

    public setup(): void {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                guildId VARCHAR(20) NOT NULL UNIQUE,
                language VARCHAR(5) DEFAULT "en"
                teacherRoleId VARCHAR(20),
            )
        `);
    }

    public queryGuild(guildId: string): DbResult<DbGuild | null> {
        const res = this.db.query(`SELECT * FROM ${this.name} WHERE guildId = ?`, guildId);

        if(!res.value) return res;

        return new DbResult(
            res.statement,
            new DbGuild(res.value as RawDbGuild, this)
        );
    }
}