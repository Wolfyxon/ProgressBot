import Database from "./database";

export default class DbTable {
    name: string;
    db: Database;

    constructor(name: string, db: Database) {
        this.name = name;
        this.db = db;
    }

    public setup(): void {
        throw "Setup function not implemented";
    }
}