import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command";
import { Answer } from "../db/quizzes";

const answerLetters = ["a", "b", "c", "d"];

const command = new Command()
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
                            .setCustomId(ctx.getComponentId(answerLetters[i]))
                            .setLabel(answerLetters[i].toUpperCase())
                            .setStyle(i + 1)
                    ))
            ],
            withResponse: true
        });
        
        ctx.db.quizzes.addQuiz(reply.resource!.message!.id, correctAnswer, reward);
    });

answerLetters.forEach(letter => {
    command.addButtonHandler(letter, (ctx) => {
        const messageId = ctx.interaction.message.id;
        const userId = ctx.interaction.user.id;

        const quizRes = ctx.db.quizzes.queryQuiz(messageId);
        const quiz = quizRes.value;
        
        if(!quiz) {
            ctx.interaction.reply({
                content: ":x: " + ctx.getTranslation({
                    en: "This quiz is somehow not in the database. Contact Wolfyxon",
                    pl: "Tego quizu z jakiegoś powodu nie ma w bazie danych, powiadom Wolfyxona"
                }),

                flags: MessageFlags.Ephemeral
            })

            return;
        }

        const answer = quiz.queryAnswer(userId).value;
        const correctAnswerText = `**${quiz.correctAnswer.toUpperCase()}**`;

        if(answer) {
            const userAnswerText = `**${answer.toUpperCase()}**`;

            ctx.interaction.reply({
                content: ctx.getTranslation({
                    en: `You've already answered ${userAnswerText}! \nThe correct answer is: ${correctAnswerText}.`,
                    pl: `Już odpowiedziałeś ${userAnswerText}! \nPoprawna odpowiedź to: ${correctAnswerText}.`
                }),

                flags: MessageFlags.Ephemeral
            });

            return;
        }

        try {
            ctx.db.quizzes.answers.addAnswer(messageId, userId, letter as Answer);
        } catch (e) {
            ctx.interaction.reply({
                content: ":x: " + ctx.getTranslation({
                    en: "An error ocurred while submitting your answer. Contact Wolfyxon",
                    pl: "Przy wysyłaniu odpowiedzi nastąpił błąd. Powiadom Wolfyxona"
                }) + `\n \`\`\`\n${e}\`\`\``,

                flags: MessageFlags.Ephemeral
            })
        }

        if(letter == quiz.correctAnswer) {
            const rewardText = `\`${quiz.rewardXp}\``;

            ctx.interaction.reply({
                content: ":tada:" + ctx.getTranslation({
                    en: `Correct! \nYou get ${rewardText} XP.`,
                    pl: `Dobrze! \nOtrzymujesz ${rewardText} XP.`
                }),

                flags: MessageFlags.Ephemeral
            });
        } else {
            ctx.interaction.reply({
                content: ":face_with_diagonal_mouth:" + ctx.getTranslation({
                    en: `Wrong answer. \nThe correct answer is: ${correctAnswerText}. \nBetter luck next time!`,
                    pl: `Zła odpowiedź. \nPoprawna odpowiedź to: ${correctAnswerText}. \nPowodzenia innym razem!`
                }),

                flags: MessageFlags.Ephemeral
            });
        }
    });
});

export default command;