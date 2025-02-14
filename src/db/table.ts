import Database from "./database";

export class RowObject<D extends Object, T extends DbTable> {
    tbl: T;
    
    constructor(data: D, table: T) {
        this.tbl = table;
        this.loadData(data);
    }

    public loadData(data: D) {
        throw "loadData() not implemented";
    }

    public reload() {
        throw "reload() not implemented";
    }
}

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