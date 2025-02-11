import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("say")
            .setDescription("Repeats text")
            
            .addStringOption(option => option
                .setName("text")
                .setDescription("Text to repeat")
                .setRequired(true)
                
            ),
    
    run: async (ctx) => {
        const msg = ctx.interaction.options.get("text")!.value as string;

        ctx.interaction.reply(msg);
    }
});