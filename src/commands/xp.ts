import { EmbedBuilder, GuildMember, SlashCommandBuilder, User } from "discord.js";
import Command from "../command";

export default new Command()
    .setBuilder(
        new SlashCommandBuilder()
        .setName("xp")
        
        .setDescription("Manage user XP")
        .setDescriptionLocalizations({
            pl: "Zarządzaj XP użytkowników"
        })
        
        .addSubcommand(cmd => 
            cmd
                .setName("add")
                .setDescription("Add XP")
                .setDescriptionLocalizations({
                    pl: "Dodaj XP"
                })

                .addUserOption(option =>
                    option
                        .setName("user")
                        .setNameLocalizations({
                            pl: "użytkownik"
                        })

                        .setDescription("User to add XP to")
                        .setDescriptionLocalizations({
                            pl: "Użytkownik, który ma otrzymać XP"
                        })

                        .setRequired(true)
                )
                .addNumberOption(option => 
                    option
                        .setName("amount")
                        .setNameLocalizations({
                            pl: "ilość"
                        })

                        .setDescription("Amount of XP to add")
                        .setDescriptionLocalizations({
                            pl: "Ilość XP do dodania"
                        })
                        
                        .setRequired(true)
                )
        )
        .addSubcommand(cmd => 
            cmd
                .setName("addall")
                .setDescription("Gives XP to all users in the same voice channel or a stage as you")
                .setDescriptionLocalizations({
                    pl: "Dodaje XP wszystkim użytkownikom w tym samym kanale głosowym lub scenie co ty"
                })
                .addNumberOption(opt =>
                    opt
                        .setName("amount")
                        .setRequired(true)
                        .setDescription("The amount of XP to give")
                        .setDescriptionLocalizations({
                            pl: "Ilość XP do dodania"
                        })
                )
        )
        .addSubcommand(cmd => 
            cmd
                .setName("setup")
                .setDescription("Sets up all users in the server") 
        )
    )
    .setRun(async (ctx) => {
        await ctx.interaction.deferReply();

        if(!ctx.getDbGuild().isTeacher(ctx.interaction.member! as GuildMember)) {
            ctx.interaction.editReply(":x: " + ctx.getTranslation({
                en: "You're not a teacher!",
                pl: "Nie jesteś nauczycielem!"
            }));
            
            return;
        }

        function checkUser(user: User): boolean {
            if(user.bot) {
                ctx.interaction.editReply(":x: " + ctx.getTranslation({
                    en: "This user is a bot",
                    pl: "Ten użytkownik jest botem"
                }));

                return true;
            }

            return false;
        }

        switch (ctx.interaction.options.getSubcommand(true)) {
            case "add": {
                const amount = ctx.interaction.options.getNumber("amount", true);
                const user = ctx.interaction.options.getUser("user", true);

                if(checkUser(user)) return;

                const dbUser = ctx.db.users.getUser(ctx.interaction.guildId!, user.id);
                const res = dbUser.addXp(amount);

                const mention = `<@${user.id}>`;

                const text = ctx.getTranslation({
                    en: `Added \`${amount}\` XP to ${mention}`,
                    pl: `Przyznano \`${amount}\` XP, ${mention}`
                });

                ctx.interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`:white_check_mark: ${text} ${res.getCodeBlock()}`)
                    ]
                });

                break;
            }

            case "addall": {
                if (!ctx.interaction.inCachedGuild()) {
                    ctx.interaction.editReply("This server doesn't seem to be cached, try again later");
                    return;
                }
                
                const xp = ctx.interaction.options.getNumber("amount")!;
                const voice = ctx.interaction.member.voice;
                const channel = voice?.channel;
                
                if (!voice) {
                    ctx.interaction.editReply(ctx.getTranslation({
                        en: "Failed to get your voice state",
                        pl: "Błąd przy uzyskiwaniu twojego stanu głosowego"
                    }));

                    return;
                }

                if (!channel) {
                    ctx.interaction.editReply(ctx.getTranslation({
                        en: "You need to be in a voice channel",
                        pl: "Musisz być na kanale głosowym"
                    }));

                    return;
                }

                channel.members.forEach(m => {
                    ctx.db.users.setupUser(m.guild.id, m.user.id);
                });

                ctx.db.users.incrementXp(ctx.interaction.guildId, channel.members.map(m => m.id), xp);
                
                ctx.interaction.editReply(ctx.getTranslation({
                    en: `Granted **${xp}** XP to ${channel.members.size} users`,
                    pl: `Przyznano **${xp}** XP ${channel.members.size} użytkownikom`
                }));

                break;
            }

            case "setup": {
                const limit = 100;

                if(ctx.interaction.guild?.memberCount! > limit) {
                    ctx.interaction.editReply("Too much members. Edit the code if you want to remove this limit.");
                    return;
                }

                const members = (await ctx.interaction.guild?.members.fetch())!;

                if(members.size == 0) {
                    ctx.interaction.reply("No users found, please enable the guild memebers intent");
                    return;
                }

                members.forEach((member) => {
                    if(member.user.bot) return;

                    ctx.db.users.setupUser(ctx.interaction.guildId!, member.id);
                });

                ctx.interaction.editReply("Users added");
                break;
            }

            default: {
                ctx.interaction.editReply("The bot pooped itself");
            }
        }
    });