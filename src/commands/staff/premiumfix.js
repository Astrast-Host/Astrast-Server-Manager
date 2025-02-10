const Discord = require("discord.js");
const Axios = require("axios");
const Config = require('../../../config.json');

exports.description = "Fixes a user's premium count.";

/**
 * Premium server count fix command. Locked to the staff.
 *
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {Array} args
 * @returns void
 */
exports.run = async (client, message, args) => {
    if (!message.member.roles.cache.has(Config.DiscordBot.Roles.Staff)) return;

    if (!args[1]) {
        return message.reply("Please specify a user!");
    }

    const replyMsg = await message.reply("Starting calculation...");

    try {
        let selectedUser = client.users.cache.get(
            args[1].match(/\d{17,19}/) ? args[1].match(/\d{17,19}/)[0] : args[1]
        );

        if (!selectedUser) {
            return replyMsg.edit("User not found.");
        }

        const userAccount = await userData.get(selectedUser.id);

        if (!userAccount || !userAccount.consoleID) {
            return replyMsg.edit(
                selectedUser.id === message.author.id
                    ? `You do not have a panel account linked.\n\`${Config.DiscordBot.Prefix}user new\` - Create an account\n\`${Config.DiscordBot.Prefix}user link\` - Link an account`
                    : "That user does not have a panel account linked."
            );
        }

        const response = await Axios({
            url: `${Config.Pterodactyl.hosturl}/api/application/users/${userAccount.consoleID}?include=servers`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${Config.Pterodactyl.apikey}`,
                "Content-Type": "application/json",
                Accept: "Application/vnd.pterodactyl.v1+json",
            },
        });

        const servers = response.data.attributes.relationships.servers.data;

        // **Count only premium servers correctly**
        const actualPremiumServersUsed = servers.filter(server => 
            Config.DonatorNodes.includes(server.attributes.node.toString())
        ).length;

        const userPremData = await userPrem.get(selectedUser.id);
        const storedPremiumServersUsed = userPremData.used || 0;

        if (actualPremiumServersUsed !== storedPremiumServersUsed) {
            await userPrem.set(selectedUser.id, {
                used: actualPremiumServersUsed,
                donated: userPremData.donated || 0,
            });

            replyMsg.edit("That user's premium server count has been fixed!");
        } else {
            replyMsg.edit("That user has the correct premium server count!");
        }
    } catch (err) {
        replyMsg.edit(`❌ An error occurred\n\`\`\`${err.message}\`\`\``);
    }
};