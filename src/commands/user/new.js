const Discord = require('discord.js');
const axios = require("axios");
const validator = require("validator");

const Config = require('../../../config.json');
const MiscConfigs = require('../../../config/misc-configs.js');

const generatePassword = require('../../util/generatePassword.js');
const generateCode = require('../../util/generateCode.js');
const sendMail = require('../../util/sendEmail.js');

exports.description = "Create a new panel account.";

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {Array} args 
 * @returns void
 */
exports.run = async (client, message, args) => {

    const userAccount = await userData.get(message.author.id);
    
    if (userAccount != null) {
        message.reply("You already have a `panel account` linked to your discord account.");
        return;
    }

    let questions = [
        {
            id: "tos",
            question:
                "https://astrast.com/tos\nPlease read our Terms of Service, do you accept? (**yes or no**)", // The questions...
            filter: (m) => m.author.id === message.author.id, // Filter to use...
            afterChecks: [
                {
                    check: (msg) => msg.toLowerCase() == "yes",
                    errorMessage: "You must accept our Terms of Service!",
                },
            ],
            time: 1000 * 60 * 10, // how much time a user has to answer the question before it times out
            value: null, // The user's response.
        },
        {
            id: "username",
            question:
                "What should your username be? (**Please don't use spaces or special characters**)", // The questions...
            filter: (m) => m.author.id === message.author.id, // Filter to use...
            afterChecks: [
                {
                    check: (msg) => msg.trim().split(" ").length == 1,
                    errorMessage: "Username must not contain any spaces.",
                },
            ],
            time: 30000, // how much time a user has to answer the question before it times out
            value: null, // The user's response.
        },
        {
            id: "email",
            question: "What's your email? *(must be a valid email)*",
            filter: (m) => m.author.id === message.author.id,
            afterChecks: [
                {
                    check: (msg) => validator.isEmail(msg.toLowerCase().trim()),
                    errorMessage: "The email must be valid.",
                },
            ],
            time: 30000,
            value: null,
        },
    ];

    server = message.guild;

    // Locate the account creation category
    const category = server.channels.cache.find((c) => c.id === MiscConfigs.accounts && c.type === Discord.ChannelType.GuildCategory);

    if (!category) throw new Error("Category channel does not exist.");

    // Create the channel in which the user will use to create his account
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
        reason: "User creating their account."
    });

    await channel.setParent(category, { lockPermissions: false });

    // Tell the user to check the channel.
    message.reply(`Please check <#${channel.id}> to create an account.`);

    // Send the initial question.
    let msg = null;

    ///////////////////// Below is the converted Discord V14 Code //////////////

    for (const question of questions) {
        if (msg == null) {
            msg = await channel.send({
                content: message.member.toString(),
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor("Green")
                        .setDescription(question.question)
                        .setFooter({
                            text: "You can type 'cancel' to cancel the request.",
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
            });
        } else {
            await msg.edit({
                content: message.member.toString(),
                embeds: [
                    new Discord.EmbedBuilder(msg.embeds[0])
                        .setDescription(question.question)
                ],
            });
        }

        let collectedMessages;
        try {
            collectedMessages = await channel.awaitMessages({
                filter: question.filter,
                max: 1,
                time: question.time,
                errors: ['time']
            });
        } catch (error) {
            channel.send("User failed to provide an input!\nAccount creation cancelled!");
            setTimeout(() => {
                channel.delete();
            }, 5000);
            return;
        }

        question.value = collectedMessages.first().content.trim();

        await collectedMessages.first().delete();

        if (question.value.toLowerCase() === "cancel") {
            msg.delete();
            channel.send("Cancelled!");
            setTimeout(() => {
                channel.delete();
            }, 5000);
            return;
        }

        for (const afterCheck of question.afterChecks) {
            if (!afterCheck.check(question.value)) {
                channel.send(afterCheck.errorMessage);
                channel.send("Account creation cancelled!");
                setTimeout(() => {
                    channel.delete();
                }, 5000);
                return;
            }
        }

        if (question.id === "email") {
            const verificationCode = generateCode().toString();
            await sendMail(question.value, "Your Verification Code", `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Verification Code</title><style>body{font-family:'Segoe UI',Arial,sans-serif;line-height:1.6;margin:0;padding:0;background-color:#121212}.container{max-width:600px;margin:40px auto;background:linear-gradient(145deg,#1e1e1e 0%,#2c2c2c 100%);border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);overflow:hidden}.header{background:linear-gradient(145deg,#1c1c1c 0%,#2a2a2a 100%);color:#ffffff;padding:40px 20px;text-align:center}.header h1{margin:0;font-size:32px;font-weight:600;letter-spacing:0.5px}.logo{max-width:180px;height:auto;margin-bottom:20px}.content{padding:40px;color:#e0e0e0;text-align:center}.verification-code{background:linear-gradient(145deg,#2c2c2c 0%,#3c3c3c 100%);padding:30px;margin:30px 0;text-align:center;border-radius:12px;border:2px solid #444;box-shadow:0 4px 15px rgba(0,0,0,0.05)}.code{font-size:42px;letter-spacing:6px;font-weight:bold;color:#ffffff;margin:10px 0;font-family:'Courier New',monospace}.info-text{color:#b0b0b0;font-size:16px;margin:20px 0}.warning{background:rgba(231,76,60,0.1);border-radius:8px;padding:15px;margin:20px 0;color:#ff6b6b;font-size:14px}.timer{background:rgba(52,152,219,0.1);border-radius:8px;padding:15px;margin:20px 0;color:#64b5f6;font-size:14px}.footer{background-color:#1e1e1e;text-align:center;padding:20px;color:#7f8c8d;font-size:12px;border-top:1px solid #444}.button{display:inline-block;padding:12px 24px;background:linear-gradient(145deg,#3498db 0%,#2980b9 100%);color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0;text-align:center}</style></head><body><div class="container"><div class="header"><img src="[Logo-URL]" alt="Astrast Hosting" class="logo"><h1>Verification Code</h1></div><div class="content"><p class="info-text">Here's your verification code:</p><div class="verification-code"><div class="code">${verificationCode}</div></div><div class="timer">⏰ This code will expire in 10 minutes</div><div class="warning">⚠️ If you didn't request this verification code, please ignore this email.</div><p class="info-text">Need any help?</p><a href="https://astrast.com" class="button">Visit our Site</a></div><div class="footer"><p>This is an automated message, please do not reply to this email.</p><p>© 2025 Astrast Hosting. All rights reserved.</p></div></div></body></html>`).catch((Error) => {            
                    console.error("[USER CREATION] Email could not be sent.");
                });

            questions.push({
                id: "verification",
                question: "Please enter the 10-digit verification code sent to your email:",
                filter: (m) => m.author.id === message.author.id,
                afterChecks: [
                    {
                        check: (msg) => msg === verificationCode,
                        errorMessage: "Invalid verification code. Account creation cancelled.",
                    },
                ],
                time: 1000 * 60 * 10, // 10 minutes
                value: null,
            });
        }
    }

    await msg.edit({
        content: message.member.toString(),
        embeds: [
            new Discord.EmbedBuilder(msg.embeds[0])
                .setDescription(
                    "Attempting to create an account for you...\n\n>>> " +
                    questions
                        .map((question) => `**${question.id}:** ${question.value.toLowerCase()}`)
                        .join("\n")
                )
                .setFooter(null)
                .setTimestamp(),
        ],
    });

    const data = {
        username: questions.find((question) => question.id == "username").value.toLowerCase(),
        email: questions.find((question) => question.id == "email").value.toLowerCase(),
        first_name: questions.find((question) => question.id == "username").value,
        last_name: ".",
        password: generatePassword(),
        root_admin: false,
        language: "en",
    };

    axios({
        url: Config.Pterodactyl.hosturl + "/api/application/users",
        method: "POST",
        followRedirect: true,
        maxRedirects: 5,
        headers: {
            Authorization: "Bearer " + Config.Pterodactyl.apikey,
            "Content-Type": "application/json",
            Accept: "Application/vnd.pterodactyl.v1+json",
        },
        data: data,
    })
        .then(async (user) => {
            await userData.set(`${message.author.id}`, {
                discordID: message.author.id,
                consoleID: user.data.attributes.id,
                email: user.data.attributes.email,
                username: user.data.attributes.username,
                linkTime: moment().format("HH:mm:ss"),
                linkDate: moment().format("YYYY-MM-DD"),
                domains: [],
            });

            msg.edit({
                content: message.member.toString(),
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle("Account Created! Account Information:")
                        .setColor("Green")
                        .setDescription(
                            "Panel URL: " +
                            Config.Pterodactyl.hosturl +
                            "\nUsername: `" +
                            data.username +
                            "\n`Email: `" +
                            data.email +
                            "\n`Password: `" +
                            data.password +
                            "`"
                        )
                        .setFooter({
                            text: "Please note: It is recommended that you change the password.",
                            iconURL: client.user.avatarURL(),
                        })
                        .setTimestamp(),
                ],
            });

            channel.send(
                "**You have 30 minutes to keep note of this info before the channel is deleted.**",
            );
            message.guild.members.cache.get(message.author.id).roles.add(Config.DiscordBot.Roles.Client);

            setTimeout(() => {
                channel.delete();
            }, 1800000);
        })
        .catch((err) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                msg.edit({
                    content: '',
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor("Red")
                            .setTitle("An error has occurred:")
                            .setDescription(
                                "**ERRORS:**\n\n- " +
                                errors.map((error) => error.detail.replace("\n", " ")).join("\n- ")
                            )
                            .setTimestamp()
                            .setFooter({
                                text: "Deleting in 30 seconds...",
                            }),
                    ],
                });
                setTimeout(() => {
                    channel.delete();
                }, 30000);
            } else {
                channel.send("An unexpected error has occurred, please try again later...");
                setTimeout(() => {
                    channel.delete();
                }, 30000);
            }
        });
};
