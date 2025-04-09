import { EmbedBuilder, InteractionDeferReplyOptions, MessageFlags, SlashCommandBuilder } from "discord.js";
import Command from "../command";

export default new Command()
    .setBuilder(
        new SlashCommandBuilder()
            .setName("rank")
            .setDescription("Checks your or someone else's rank")
            .setDescriptionLocalizations({
                pl: "Sprawdź swoją lub czyjąś rangę"
            })
            
            .addUserOption(o => o
                .setName("user")
                .setNameLocalizations({
                    pl: "użytkownik"
                })

                .setDescription("User to check the rank of")
                .setDescriptionLocalizations({
                    pl: "Użytkownik któremu chcesz sprawdzić rangę"
                })

                .setRequired(false)
            )
            .addBooleanOption(o => o
                .setName("ephemeral")
                .setNameLocalizations({
                    pl: "niewidzialna"
                })

                .setDescription("Should the rank be shown only to you")
                .setDescriptionLocalizations({
                    pl: "Czy ranga ma być pokazana tylko Tobie"
                })
                
                .setRequired(false)
            )
    )
    .setRun(async (ctx) => {
        const user = ctx.interaction.options.getUser("user") ?? ctx.interaction.user;
        const ephemeral = ctx.interaction.options.getBoolean("ephemeral");
        
        let options: InteractionDeferReplyOptions = {};

        if(ephemeral) {
            options.flags = MessageFlags.Ephemeral;
        }

        await ctx.interaction.deferReply(options);

        const res = ctx.db.users.queryOrSetupUser(ctx.interaction.guildId!, user.id)
        const dbUser = res.user;

        const xp = dbUser.getLevelXp();
        const reqXp = dbUser.getXpForNextLevel();

        const barWidth = 16;
        const dispXp = Math.floor(barWidth * (xp / reqXp));

        let bar = "🟩".repeat(dispXp) + "⬛".repeat(barWidth - dispXp);

        const embed = new EmbedBuilder()
                        .setAuthor({
                            name: user.displayName,
                            iconURL: user.displayAvatarURL()
                        })
                        .setTitle(`Level ${dbUser.getLevel()}`)
                        .setThumbnail(user.displayAvatarURL())
                        .setDescription(`${bar} ${xp}/${reqXp} ${res.result.getCodeBlock()}`)
                        .setFooter({
                            text: `@${user.tag} | ${user.id}`
                        });

        ctx.interaction.editReply({
            embeds: [embed]
        })
    });