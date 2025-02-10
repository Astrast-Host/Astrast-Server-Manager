const Discord = require('discord.js');

const Config = require('../../../config.json');
const MiscConfigs = require('../../../config/misc-configs.js');

const getUser = require("../../util/getUser.js");
const generateCode = require("../../util/generateCode.js");
const sendEmail = require("../../util/sendEmail.js");

exports.description = "Link your console account to your Discord account.";

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
exports.run = async (client, message, args) => {

    // The user does not have a panel account linked and would like to link one.
    if (await userData.get(message.author.id) != null) {

        const AlreadyLinkedEmbed = new Discord.EmbedBuilder()
        .setColor(`Green`)
        .addFields(
            { name: `**__Username__**`, value: await userData.get(message.author.id + ".username") },
            { name: `**__Linked Date (YYYY-MM-DD)__**`, value: await userData.get(message.author.id + ".linkDate") },
            { name: `**__Linked Time__**`, value: await userData.get(message.author.id + ".linkTime") },
        )
        .setTimestamp()
        .setFooter({text: client.user.username, iconUrl: client.user.avatarURL()});

        message.reply({content: "This account is linked!", embeds: [AlreadyLinkedEmbed]});
    } else {
        const server = message.guild;

        const channel = await server.channels.create({
            name: message.author.username,
            type: Discord.ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: message.author.id,
                    allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: server.id,
                    deny: [Discord.PermissionFlagsBits.ViewChannel]
                }
            ],
            reason: "User linking their account."
        });

        message.reply(`Please check <#${channel.id}> to link your account.`);

        const category = server.channels.cache.find((c) => c.id === MiscConfigs.accounts && c.type === Discord.ChannelType.GuildCategory);

        if (!category) throw new Error("Category channel does not exist");

        await channel.setParent(category, { lockPermissions: false });

        const InitialEmbed = new Discord.EmbedBuilder()
        .setColor("Blue")
        .setTitle("Please enter your account email address:")
        .setDescription("You have 2 minutes to respond.\n\nThis will take a few seconds to find your account.")
        .setFooter(
            { text: "You can type 'cancel' to cancel the request.", iconURL: client.user.avatarURL() }
        );

        const msg = await channel.send({content: message.author.toString(), embeds: [InitialEmbed]});

        const EmailCollector = new Discord.MessageCollector(
            msg.channel,
            {
                "max": 1, //Collect 1 message max.
                "time": 2 * 60 * 1000, //Gives the user 2 minutes to respond.
                "idle": 2 * 60 * 1000, //If the user is idle for 2 minutes, the collector will end.
                "filter": (m) => m.author.id === message.author.id, //Only collect messages from the initial command user.
            }
        );

        EmailCollector.on("collect", async (MessageCollected) => {

            await MessageCollected.delete();

            if (MessageCollected.content.toLocaleLowerCase() === "cancel") {

                const CancelEmbed = new Discord.EmbedBuilder();
                CancelEmbed.setColor("Red");
                CancelEmbed.setDescription("Request to link your account canceled.");
                CancelEmbed.setTimestamp();
                CancelEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});

                await msg.edit({content: "You cancelled this request.", embeds: [CancelEmbed]}); //Edits the message to show the user the ticket was cancelled.

                //Stops the collector.
                await EmailCollector.stop();

                setTimeout(async () => {
                    //Deletes the channel after 10 seconds.
                    await channel.delete("User cancelled the request.");

                }, 10 * 1000); 
            } else {
                await EmailCollector.stop();
            }
        });

        EmailCollector.once("end", async (MessageCollected, Reason) => {

            if(MessageCollected.size > 0 && MessageCollected.first().content.toLocaleLowerCase() === "cancel") return; //Already being handled.
            
            const CancelEmbed = new Discord.EmbedBuilder();
            CancelEmbed.setColor("Red");
            CancelEmbed.setDescription("Request to link your account canceled.");
            CancelEmbed.setTimestamp();
            CancelEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});

            // No messages were collected.
            if(MessageCollected.size === 0) {
                await msg.edit({ content: "You did not provide an email address in time.", embeds: [CancelEmbed] });

                setTimeout(async () => {
                    await msg.channel.delete("User did not provide an email address in time.");
                }, 10 * 1000);
            };

            // A single message was collected.
            if (MessageCollected.size == 1) {
                const Email = MessageCollected.first().content;

                await EmailVerification(Email);
            }
        });

        // Now we process the email verification.
        async function EmailVerification(Email) {

            let Users = null;

            try {
                Users = await getUser(Email);
            } catch (Error) {
                // Do Nothing.
            }

            // Panel was not able to return such data.
            if (Users == null){
                const ErrorEmbed = new Discord.EmbedBuilder();
                ErrorEmbed.setColor("Red");
                ErrorEmbed.setDescription("An error occurred while fetching your account. Please try again later.");
                ErrorEmbed.setTimestamp();
                ErrorEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});

                await msg.edit({content: "An error occurred while fetching your account.", embeds: [ErrorEmbed]});

                setTimeout(async () => {
                    await channel.delete("An error occurred while fetching the account.");
                }, 10 * 1000);
                return;
            }
            
            const User = Users.data.find((usr) =>
                usr.attributes ? usr.attributes.email === Email : false,
            );

            const Code = generateCode(10);
            
            //This will not send the verification code, that's it.
            if (!User) {
                message.guild.channels.cache.get(MiscConfigs.accountLinked).send(`User ${message.author.username} (${message.author.id}) tried to link their account but the email was not found in the database.`);
            } else {
                await sendEmail(
                    Email, 
                    "Astrast Hosting - Account Linking Verification",
                    `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Linking Verification</title>
        <style>
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #1a1a1a;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background: linear-gradient(145deg, #2d2d2d 0%, #1f1f1f 100%);
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(145deg, #1a237e 0%, #3949ab 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .logo {
                max-width: 180px;
                height: auto;
                margin-bottom: 20px;
            }
            .content {
                padding: 40px;
                color: #ffffff;
            }
            .verification-code {
                background: linear-gradient(145deg, #333333 0%, #2b2b2b 100%);
                padding: 25px;
                margin: 30px 0;
                text-align: center;
                border-radius: 12px;
                border: 2px solid #404040;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            .code {
                font-size: 36px;
                letter-spacing: 4px;
                font-weight: bold;
                color: #ffffff;
                margin: 0;
                font-family: 'Courier New', monospace;
            }
            .user-info {
                background: rgba(63, 81, 181, 0.15);
                border-left: 4px solid #3f51b5;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .user-info p {
                margin: 10px 0;
                color: #e0e0e0;
            }
            .user-info strong {
                color: #ffffff;
            }
            .warning {
                background: rgba(244, 67, 54, 0.15);
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #ff8a80;
                font-size: 14px;
            }
            .footer {
                background-color: #1f1f1f;
                text-align: center;
                padding: 20px;
                color: #9e9e9e;
                font-size: 12px;
                border-top: 1px solid #404040;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(145deg, #3f51b5 0%, #3949ab 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="[Your-Logo-URL]" alt="Astrast Hosting" class="logo">
                <h1>Account Linking Verification</h1>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                
                <p>We received a request to link a Discord account with your Astrast Hosting console email address.</p>
                
                <div class="user-info">
                    <p><strong>Discord Username:</strong> ${message.author.username}</p>
                    <p><strong>Discord ID:</strong> ${message.author.id}</p>
                </div>
                
                <p>Here's your verification code:</p>
                
                <div class="verification-code">
                    <p class="code">${Code}</p>
                </div>
                
                <div class="warning">
                    ⚠️ If you did not request this account linking, please ignore this email or contact our support team immediately.
                </div>
                
                <a href="https://astrast.com" class="button">Visit our Site</a>
                
                <p>Best regards,<br>
                The Astrast Hosting Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 Astrast Hosting. All rights reserved.</p>
            </div>
        </div>
    </body>
</html>`
                ).catch((Error) => {            
                    console.error("[ACCOUNT LINKING] Email could not be sent.");
                });
            }

            const VerificationEmbed = new Discord.EmbedBuilder();
            VerificationEmbed.setColor("Blurple");
            VerificationEmbed.setDescription("If an account exists, a code was sent to your email address. You have 10 minutes to provide a code.");
            VerificationEmbed.setFooter({text: "You can type 'cancel' to cancel the request.", iconURL: await client.user.avatarURL({extension: 'png'})});
            VerificationEmbed.setTimestamp();

            await msg.edit({content: msg.content.toString(), embeds: [VerificationEmbed]});

            const VerificationCollector = new Discord.MessageCollector(
                msg.channel,
                {
                    "max": 1, //Collect 1 message max.
                    "time": 10 * 60 * 1000, //Gives the user 10 minutes to respond.
                    "idle": 10 * 60 * 1000, //If the user is idle for 10 minutes, the collector will end.
                    "filter": (m) => m.author.id === message.author.id, //Only collect messages from the initial command user.
                }
            );

            VerificationCollector.on("collect", async (MessageCollected) => {

                await MessageCollected.delete();

                if (MessageCollected.content.toLocaleLowerCase() === "cancel") {
        
                    const CancelEmbed = new Discord.EmbedBuilder();
                    CancelEmbed.setColor("Red");
                    CancelEmbed.setDescription("Request to link your account canceled.");
                    CancelEmbed.setTimestamp();
                    CancelEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});
        
                    await msg.edit({content: "You cancelled this request.", embeds: [CancelEmbed]}); //Edits the message to show the user the ticket was cancelled.
        
                    //Stops the collector.
                    await VerificationCollector.stop();
        
                    setTimeout(async () => {
                        //Deletes the channel after 10 seconds.
                        await channel.delete("User cancelled the request.");
        
                    }, 10 * 1000); 
                } else {
                    VerificationCollector.stop();
                }        
            });

            VerificationCollector.once("end", async (MessageCollected, Reason) => {

                if(MessageCollected.size > 0 && MessageCollected.first().content.toLocaleLowerCase() === "cancel") return; //Already being handled.

                const CancelEmbed = new Discord.EmbedBuilder();
                CancelEmbed.setColor("Red");
                CancelEmbed.setDescription("Request to link your account canceled.");
                CancelEmbed.setTimestamp();
                CancelEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});

                // No messages were collected.
                if(MessageCollected.size === 0) {
                    msg.edit({ content: "You did not provide an verification in time.", embed: CancelEmbed });
                };

                // A single message was collected.
                if (MessageCollected.size == 1) {
                    const ResponseCode = MessageCollected.first().content;

                    if (Code === ResponseCode) {
                        const timestamp = `${moment().format("HH:mm:ss")}`;
                        const datestamp = `${moment().format("DD-MM-YYYY")}`;

                        await userData.set(`${message.author.id}`, {
                            discordID: message.author.id,
                            consoleID: User.attributes.id,
                            email: User.attributes.email,
                            username: User.attributes.username,
                            linkTime: timestamp,
                            linkDate: datestamp,
                            domains: [],
                            epochTime: (Date.now() / 1000)
                        });

                        const StaffLogs = new Discord.EmbedBuilder();
                        StaffLogs.setColor("Green");
                        StaffLogs.setTitle("Account Linked:");
                        StaffLogs.addFields(
                            { name: "**Linked Discord Account:**", value: `${message.author.toString()} - (${message.author.id})`, inline: false },
                            { name: `**Linked Console account email:**`, value: "`" + User.attributes.email + "`", inline: false },
                            { name: `**Linked At: (TIME / DATE)**`, value: `${timestamp} / ${datestamp}`, inline: false },
                            { name: `**Linked Console ID:**`, value: `${User.attributes.id}`, inline: false },
                            { name: `**Linked Time [BETA]**`, value: `<t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`, inline: false }
                        ); 

                        const FinalEmbed = new Discord.EmbedBuilder();
                        FinalEmbed.setColor("Green");
                        FinalEmbed.setDescription("**Account linked! Channel deleting in 10 seconds.**");
                        FinalEmbed.setTimestamp();
                        FinalEmbed.setFooter({text: client.user.username, iconURL: await client.user.avatarURL({extension: 'png'})});

                        await msg.edit({embeds: [FinalEmbed]}).then(async () => {
                            await client.channels.cache.get(MiscConfigs.accountLinked).send({content: `<@${message.author.id}> linked their account. Here's some info: `, embeds: [StaffLogs]});

                            //Deletes the channel after 10 seconds.
                            setTimeout(async () => {
                                await channel.delete();
                            }, 10 * 1000)
                        });

                    } else {
                        const InvalidEmbed = new Discord.EmbedBuilder();
                        InvalidEmbed.setColor("Red");
                        InvalidEmbed.setDescription("The code you provided is incorrect. Account linking cancelled.");
                        InvalidEmbed.setTimestamp();
                        InvalidEmbed.setFooter({text: "This channel will be deleted in 10 seconds."});

                        msg.edit({content: "The code you provided is incorrect.", embeds: [InvalidEmbed]});

                        //Deletes the channel after 10 seconds.
                        setTimeout(async () => {
                            await channel.delete();
                        }, 10 * 1000)
                    }
                }
            });
        }
    }
}
