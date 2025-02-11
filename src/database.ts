import { DatabaseSync } from "node:sqlite";

const TBL_USERS = "Users";

export default class Database {
    public db: DatabaseSync;
    
    constructor(file?: string) {
        this.db = new DatabaseSync(file ?? "data.db");
    }

    public setup() {
        this.db.exec(`

        CREATE TABLE IF NOT EXISTS ${TBL_USERS} (
            user_id VARCHAR(20) NOT NULL,
            guild_id VARCHAR(20) NOT NULL,
            xp INTEGER NOT NULL DEFAULT 0,
            level INTEGER NOT NULL DEFAULT 1,
            
            UNIQUE (user_id, guild_id)
        )

        `);
    }

    public getGuildUsers(guild: string) {
        return this.db.prepare(`
            SELECT * FROM ${TBL_USERS} WHERE guild_id = ?
        `).all(guild);
    }

    public addUser(guild: string, user: string) {
        const query = this.db.prepare(`
            INSERT INTO ${TBL_USERS} (user_id, guild_id) VALUES (?, ?)
        `);

        query.run(user, guild);
    }
}