import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command";

const answerLetters = ["a", "b", "c", "d"];

export default new Command()
    .makeTeacherOnly()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("quiz")
            .setDescription("Creates a quiz")

            .addNumberOption(opt => opt
                .setName("reward")
                .setDescription("Reward XP for answering correctly")
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName("correct")
                .setDescription("Correct answer letter")
                .setRequired(true)
                .addChoices(
                    answerLetters.map(l => {
                        return { name: l.toUpperCase(), value: l }
                    })
                )
            )
    )
    .setRun(async (ctx) => {
        const correctAnswer = ctx.interaction.options.getString("correct", true);
        const reward = ctx.interaction.options.getNumber("reward", true);
        
        const correctAnswerIdx = answerLetters.indexOf(correctAnswer);

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
                    const label = `Answer ${l.toUpperCase()}`;
                    
                    const input = new TextInputBuilder()
                        .setCustomId(l)
                        .setStyle(TextInputStyle.Short);

                    if(l == correctAnswer) {
                        input.setLabel(`✅ ${label}`);
                    } else {
                        input.setLabel(`❌ ${label}`);
                    }
                    
                    input.setRequired(i <= correctAnswerIdx);

                    return new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(input);
                }))
        );

        const modalInt = await ctx.awaitModalSubmit("quizCreation");

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

        const reply = await modalInt.reply({
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
        
        ctx.db.quizzes.addQuiz(reply.id, correctAnswer, reward);
    });