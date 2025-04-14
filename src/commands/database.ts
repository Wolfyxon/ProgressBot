import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command()
    .makeDevOnly()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("database")
            .setDescription("Database management commands, only for developers.")

            .addSubcommand(cmd => cmd
                .setName("run")
                .setDescription("Runs a SQL query.")
                
                .addStringOption(opt => opt
                    .setName("query")
                    .setDescription("SQL query")
                    .setRequired(true)
                )
                .addBooleanOption(opt => opt
                    .setName("dangerous")
                    .setDescription("Allows UPDATE without WHERE")
                    .setRequired(false)
                )
            )
            .addSubcommand(cmd => cmd
                .setName("query")
                .setDescription("Runs a SQL query and shows the returned data")
                
                .addStringOption(opt => opt
                    .setName("query")
                    .setDescription("SQL query")
                    .setRequired(true)
                )
                .addBooleanOption(opt => opt
                    .setName("dangerous")
                    .setDescription("Allows UPDATE without WHERE")
                    .setRequired(false)
                )
            )
            .addSubcommand(cmd => cmd
                .setName("rmuser")
                .setDescription("Removes a user from the database")

                .addUserOption(opt => opt
                    .setName("user")
                    .setDescription("User to remove")
                    .setRequired(true)
                )
                .addBooleanOption(opt => opt
                    .setName("global")
                    .setDescription("Should the user be removed from all servers")
                    .setRequired(false)
                )
            )
    )
    .setRun(async (ctx) => {
        function dangerCheck(query: string): boolean {
            query = query.toLowerCase();
            const dangerMode = ctx.interaction.options.getBoolean("dangerous", false) ?? false;

            if(!dangerMode) {
                const hasDangerous = query.includes("update") || query.includes("delete");

                if(hasDangerous && !query.includes("where")) {
                    ctx.interaction.editReply(":warning: `UPDATE` and `DELETE` must be used with `WHERE` or you'll destroy the database. \nUse with **dangerous** to run anyway.");
                    return false;
                }
            }

            return true;
        }

        switch(ctx.interaction.options.getSubcommand(true)) {
            case "run": {
                await ctx.interaction.deferReply();

                const query = ctx.interaction.options.getString("query", true);
                if(!dangerCheck(query)) return;
                
                try {
                    const res = ctx.db.run(query);
                    ctx.interaction.editReply(`:white_check_mark: Query successful. \`${res.value.changes}\` changes`);

                } catch (e) {
                    ctx.interaction.editReply(`:x: SQL error: \`\`\`${e}\`\`\``);
                }

                break;
            }

            case "query": {
                await ctx.interaction.deferReply();

                const query = ctx.interaction.options.getString("query", true);
                if(!dangerCheck(query)) return;

                try {
                    const res = ctx.db.queryAll(query);
                    
                    let maxLen = 0;
                    
                    res.value.forEach(row => {
                        Object.entries(row).forEach(([key, value]) => {
                            const vString = String(value);
                            
                            if(key.length > maxLen) {
                                maxLen = key.length;
                            }
                            if(vString.length > maxLen) {
                                maxLen = vString.length;
                            }
                        });
                    });

                    const embed = new EmbedBuilder();
                    const lines: string[] = [];

                    function addRow(columns: string[]) {
                        let row: string[] = [];

                        columns.forEach(column => {
                            row.push(column + " ".repeat(maxLen - column.length));
                        });

                        lines.push(row.join(" | "));
                    }
                    
                    res.value.forEach(row => {
                        if(lines.length == 0) {
                            const keys = Object.keys(row);
                            const sep = "-".repeat(maxLen);
                            
                            addRow(keys);
                            addRow(keys.map(k => sep));
                        }

                        addRow(
                            Object.values(row).map(v => String(v))
                        );
                    });

                    ctx.interaction.editReply(`\`\`\`${lines.join("\n")}\`\`\``);
                } catch (e) {
                    ctx.interaction.editReply(`:x: SQL error: \`\`\`${e}\`\`\``);
                }

                break;
            }

            case "rmuser": {
                const user = ctx.interaction.options.getUser("user", true);
                const global = ctx.interaction.options.getBoolean("global", false) ?? false;

                await ctx.interaction.deferReply();

                if(global) {
                    ctx.db.users.removeUserFromAll(user.id);
                    ctx.interaction.editReply("User removed successfully from all servers");
                } else {
                    ctx.db.users.removeUser(ctx.interaction.guildId!, user.id);
                    ctx.interaction.editReply("User removed successfully from this server");
                }

                break;
            }
        }
    });