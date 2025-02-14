import Database from "./database";
import DbTable from "./table";

export type RawDbGuild = {
    guildId: string,
    teacherRoleId?: string
}

export default class Guilds extends DbTable {
    constructor(db: Database) {
        super("Guilds", db);
    }

    public setup(): void {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                guildId VARCHAR(20) NOT NULL UNIQUE,
                teacherRoleId VARCHAR(20),
                language VARCHAR(5) DEFAULT "en"
            )
        `);
    }
}