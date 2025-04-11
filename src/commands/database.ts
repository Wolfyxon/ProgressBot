import { SlashCommandBuilder } from "discord.js";
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
        switch(ctx.interaction.options.getSubcommand(true)) {
            case "run": {
                await ctx.interaction.deferReply();

                const query = ctx.interaction.options.getString("query", true);
                const dangerMode = ctx.interaction.options.getBoolean("dangerous", false) ?? false;
                
                if(!dangerMode) {
                    if(query.includes("UPDATE") && !query.includes("WHERE")) {
                        ctx.interaction.editReply(":x: `UPDATE` must be paired with `WHERE` or you'll destroy the database. \nUse with **dangerous** to run anyway.");
                        return;
                    }
                }
                
                try {
                    const res = ctx.db.run(query);
                    ctx.interaction.editReply(`Query successful. \`${res.value.changes}\` changes`);

                } catch (e) {
                    ctx.interaction.editReply(`SQL error: \`\`\`${e}\`\`\``);
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