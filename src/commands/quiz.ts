import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command";

export default new Command()
    .makeTeacherOnly()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("quiz")
            .setDescription("Creates a quiz")

            .addNumberOption(opt => opt
                .setName("reward")
                .setDescription("Reward XP for answering correctly")
            )
    )
    .setRun(async (ctx) => {
        const answerLetters = ["a", "b", "c", "d"];

        await ctx.interaction.showModal(
            new ModalBuilder()
                .setTitle("Quiz")
                .setCustomId("quizCreation")
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setLabel("Quiz description")
                                .setCustomId("description")
                                .setRequired(true)
                                .setStyle(TextInputStyle.Paragraph),
                        )
                )
                .addComponents(answerLetters.map((l, i) => {
                    const input = new TextInputBuilder()
                        .setCustomId(l)
                        .setLabel(`Answer ${l.toUpperCase()}`)
                        .setStyle(TextInputStyle.Short);

                    if(i > 1) {
                        input.setRequired(false);
                    } 

                    return new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(input);
                }))
        );

        const modalInt = await ctx.awaitModalSubmit("quizCreation");
        const reward = ctx.interaction.options.getNumber("reward", true);

        const description = modalInt.fields.getTextInputValue("description");
        const answers: string[] = [];

        answerLetters.forEach(l => {
            const val = modalInt.fields.getTextInputValue(l);

            if(val) {
                answers.push(val);
            }
        });
        
        const rewardText = ctx.getTranslation({
            en: "Reward",
            pl: "Nagroda"
        });

        modalInt.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        [
                            description,
                            answers.map((ans, i) => `:regional_indicator_${answerLetters[i]}: ${ans}`).join("\n"),
                            `:star: **${rewardText}:** \`${reward}\` XP`
                            
                        ].join("\n\n")
                    )
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(answers.map((ans, i) => 
                        new ButtonBuilder()
                            .setCustomId(answerLetters[i])
                            .setLabel(answerLetters[i].toUpperCase())
                            .setStyle(i + 1)
                    ))
            ]
        });
    });