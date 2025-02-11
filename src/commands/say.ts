import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command({
    builder: new SlashCommandBuilder()
            .setName("say")
            .addStringOption(option => option
                .setName("text")
                .setRequired(true)
                
            ),
    
    run: async (interaction: CommandInteraction) => {
        const msg = interaction.options.get("text")!.value as string;

        interaction.reply(msg);
    }
});