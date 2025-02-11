import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("say")
            .addStringOption(option => option
                .setName("text")
                .setRequired(true)
                
            ),
    
    run: async (ctx) => {
        const msg = ctx.interaction.options.get("text")!.value as string;

        ctx.interaction.reply(msg);
    }
});