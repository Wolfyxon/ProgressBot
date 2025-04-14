import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command";
import { Answer } from "../db/quizzes";
import { wait } from "../utils";

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
    command.addButtonHandler(letter, async (ctx) => {
        await ctx.interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const messageId = ctx.interaction.message.id;
        const userId = ctx.interaction.user.id;

        const quizRes = ctx.db.quizzes.queryQuiz(messageId);
        const quiz = quizRes.value;
        
        if(!quiz) {
            ctx.interaction.editReply({
                content: ":x: " + ctx.getTranslation({
                    en: "This quiz is somehow not in the database. Contact Wolfyxon",
                    pl: "Tego quizu z jakiegoś powodu nie ma w bazie danych, powiadom Wolfyxona"
                })
            });

            return;
        }

        const answer = quiz.queryAnswer(userId).value;
        const correctAnswerText = `**${quiz.correctAnswer.toUpperCase()}**`;

        if(answer) {
            const userAnswerText = `**${answer.answer.toString().toUpperCase()}**`;

            ctx.interaction.editReply({
                content: ctx.getTranslation({
                    en: `You've already answered ${userAnswerText}! \nThe correct answer is: ${correctAnswerText}.`,
                    pl: `Już odpowiedziałeś ${userAnswerText}! \nPoprawna odpowiedź to: ${correctAnswerText}.`
                })
            });

            return;
        }

        let answerAddRes;

        try {
            answerAddRes = ctx.db.quizzes.answers.addAnswer(messageId, userId, letter as Answer);
        } catch (e) {
            ctx.interaction.editReply({
                content: ":x: " + ctx.getTranslation({
                    en: "An error ocurred while submitting your answer. Contact Wolfyxon",
                    pl: "Przy wysyłaniu odpowiedzi nastąpił błąd. Powiadom Wolfyxona"
                }) + `\n \`\`\`\n${e}\`\`\``,
            });
        }

        const embed = new EmbedBuilder();

        if(letter == quiz.correctAnswer) {
            const rewardText = `\`${quiz.rewardXp}\``;

            const user = ctx.db.users.getUser(ctx.interaction.guildId!, ctx.interaction.user.id);
            await wait(0.1);

            const xpAddRes = user.addXp(quiz.rewardXp);

            embed.setTitle(":tada: " + ctx.getTranslation({
                en: `Correct!`,
                pl: `Dobrze!`
            }));

            embed.setDescription(ctx.getTranslation({
                en: `You get ${rewardText} XP.`,
                pl: `Otrzymujesz ${rewardText} XP.`
            }) + "\n" +  answerAddRes!.getCodeBlock() + xpAddRes.getCodeBlock());

            embed.setColor("Green");
        } else {
            embed.setTitle(":face_with_diagonal_mouth: " + ctx.getTranslation({
                en: "Wrong answer",
                pl: "Zła odpowiedź"
            }));

            embed.setDescription(ctx.getTranslation({
                en: `The correct answer is: ${correctAnswerText}. \nBetter luck next time!`,
                pl: `Poprawna odpowiedź to: ${correctAnswerText}. \nPowodzenia innym razem!`
            }) + "\n" +  answerAddRes!.getCodeBlock());

            embed.setColor("Red");
        }

        ctx.interaction.editReply({
            embeds: [embed]
        });
    });
});

export default command;