import Database from "./database";

export default abstract class DbTable {
    name: string;
    db: Database;

    constructor(name: string, db: Database) {
        this.name = name;
        this.db = db;
    }

    public abstract setup(): void;
}