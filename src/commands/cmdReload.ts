import { MessageFlags, SlashCommandBuilder } from "discord.js";
import Command, { registerGuildCommands } from "../command";

export default new Command()
    .makeDevOnly()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("cmdreload")
            .setDescription("Reloads commands in the current server")
    )
    .setRun(async (ctx) => {
        await ctx.interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await registerGuildCommands(ctx.interaction.client.user.id, ctx.interaction.guildId!);
        
        ctx.interaction.editReply("Commands reloaded");
    });