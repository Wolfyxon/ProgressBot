import { MessageFlags, SlashCommandBuilder } from "discord.js";
import Command, { registerGuildCommands } from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("reload")
            .setDescription("Reloads commands in the current server"),
    
    run: async (ctx) => {
        await ctx.interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await registerGuildCommands(ctx.interaction.client.user.id, ctx.interaction.guildId!);
        
        ctx.interaction.editReply("Commands reloaded");
    }
});