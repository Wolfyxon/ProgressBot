import { ActionRowBuilder, BaseMessageOptions, MessageEditOptions, MessageFlags, MessagePayload, ModalBuilder, SlashCommandBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command";
import { parseJsonOrNull, trimMessageJson } from "../utils";

export default new Command()
    .makeDevOnly()
    .setBuilder(new SlashCommandBuilder()
        .setName("edit")
        .setDescription("Edits a message sent by the bot")

        .addChannelOption(opt => opt
            .setName("channel")
            .setDescription("Channel of the message")
            .setRequired(true)
        )
        .addStringOption(opt => opt
            .setName("message")
            .setDescription("ID of the message")
            .setRequired(true)  
        )
    )
    .setRun(async (ctx) => {
       const channel = ctx.interaction.options.getChannel("channel", true);
       const messageId = ctx.interaction.options.getString("message", true);
       
        if(!(channel instanceof TextChannel)) {
            ctx.interaction.reply({
                content: "Channel must be a text channel",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

       const message = await ctx.botCtx.getMessageInChannel(channel, messageId);

        if(!message) {
            ctx.interaction.reply({
                content: ":x: Message not found",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        if(!message.editable) {
            if(!message) {
                ctx.interaction.reply({
                    content: ":x: Message is not editable",
                    flags: MessageFlags.Ephemeral
                });
    
                return;
            }
        }
        
        const messageData = trimMessageJson(message.toJSON() as BaseMessageOptions);
        const json = JSON.stringify(messageData, null, 2);
        const wrappedJson = "```" + json + "```";
        
        if(wrappedJson.length > 4000) {
            ctx.interaction.reply({
                content: ":x: Data is too long to fit in a text field",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        await ctx.interaction.showModal(new ModalBuilder()
            .setTitle("Edit message data")
            .setCustomId("msgEdit")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("data")
                            .setLabel("message JSON data")
                            .setValue(wrappedJson)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
            )
        );

        const modal = await ctx.awaitModalSubmit("msgEdit");
        const dataRes = modal.fields.getTextInputValue("data").match(/```(.*)```/s);
        
        if(!dataRes) {
            ctx.interaction.reply({
                content: ":x: Invalid data",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const fullData = parseJsonOrNull(dataRes[1]) as MessageEditOptions;

        if(!fullData) {
            ctx.interaction.reply({
                content: ":x: Invalid JSON",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        try {
            await message.edit(trimMessageJson(fullData));

            modal.reply({
                content: ":white_check_mark: Message edited successfully",
                flags: MessageFlags.Ephemeral
            });

        } catch (e) {
            modal.reply({
                content: `:x: Edit failed: \`\`\`\n${e}\`\`\``,
                flags: MessageFlags.Ephemeral
            });
        }
        

    });