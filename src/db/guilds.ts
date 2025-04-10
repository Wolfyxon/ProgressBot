import { APIInteractionGuildMember, Guild, GuildMember } from "discord.js";
import Database, { DbResult, DbRunResult } from "./database";
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

    public isTeacher(member: GuildMember | APIInteractionGuildMember): boolean {
        if(!this.teacherRoleId) return false;
        
        if(member instanceof GuildMember) {
            return member.roles.cache.has(this.teacherRoleId); 
        } else {
            return member.roles.includes(this.teacherRoleId);
        }
    }

    public getTeachers(): GuildMember[] {
        const guild = this.tbl.db.botCtx.client?.guilds.cache.get(this.guildId)!;
        const res: GuildMember[] = [];

        const roleId = this.teacherRoleId;

        if (roleId) {
            const role = guild.roles.cache.get(roleId);

            if (role) {
                role.members.forEach(m => res.push(m));
            }
        }
        
        return res;
    }

    public setLanguage(lang: string): DbRunResult {
        return this.tbl.db.run(
            `UPDATE ${this.tbl.name} SET language = ? WHERE guildId = ?`
        , lang, this.guildId);
    }

    public setTeacherRole(id: string): DbRunResult {
        return this.tbl.db.run(
            `UPDATE ${this.tbl.name} SET teacherRoleId = ? WHERE guildId = ?`
        , id, this.guildId);
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
                language VARCHAR(5) DEFAULT "en",
                teacherRoleId VARCHAR(20)
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

    public queryOrSetupGuild(guildId: string): { guild: DbGuild, result: DbResult<DbGuild> | DbRunResult } {
        const setup = this.setupGuild(guildId);

        if(setup.hasChanges()) {
            return {
                guild: new DbGuild({
                    guildId: guildId,
                    language: "en"
                }, this),
                result: setup
            }
        }

        const query = this.queryGuild(guildId);

        return {
            guild: query.value as DbGuild,
            result: query as DbResult<DbGuild>
        };
    }

    public setupGuild(guildId: string): DbRunResult {
        return this.db.run(`INSERT OR IGNORE INTO ${this.name} (guildId) VALUES (?)`, guildId);
    }
}