const Discord = require('discord.js');
const Config = require('../../../config.json');
const Creation = require("../../../createData.js");

exports.description = "Create a free server. View this command for usage.";

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {Array} args 
 * @returns void
 */
exports.run = async (client, message, args) => {

    // Removes all the other arguments, and joins the strings, then limits it to 150 characters.
    const ServerName = message.content.split(" ").slice(3).join(" ").slice(0, 150) + (message.content.split(" ").slice(3).join(" ").length > 150 ? "..." : "") || "Untitled Server (settings -> server name)";

    const userAccount = await userData.get(message.author.id);

    if (userAccount == null) {
        return message.reply(
            "Oops! It looks like your Discord ID is not linked to an account. 😕\n" +
                "If you haven’t created an account yet, please take a moment to sign up. 📝 check out `" +
                Config.DiscordBot.Prefix +
                "user new` to create an account\nIf you already have an account link it using `" +
                Config.DiscordBot.Prefix +
                "user link`",
        );
    }

    function GenerateHelpEmbed(Servers) {
        const grouped = {};
      
        for (const [key, value] of Object.entries(Servers)) {
            if (value.isDisabled) continue;
            if (!grouped[value.subCategory]) grouped[value.subCategory] = [];
            grouped[value.subCategory].push(key);
        };
      
        const HelpEmbed = new Discord.EmbedBuilder()
          .setTitle('Astrast Hosting')
          .setColor("Red")
          .setFooter({ text: "Example: " + Config.DiscordBot.Prefix + "server create aio My AIO My-Server", iconURL: client.user.displayAvatarURL() })
          .setTimestamp();
      
        for (const [category, items] of Object.entries(grouped)) {
            HelpEmbed.addFields({
                name: category,
                value: items.join('\n'),
                inline: true
            });
        }
      
        return HelpEmbed;
    };
      
    const HelpEmbed = GenerateHelpEmbed(Creation.serverTypes);
    
    if (!args[1]) {
        return await message.reply({ embeds: [HelpEmbed] });
    };

    const ServerType = args[1].toLowerCase();

    if (!Object.keys(Creation.serverTypes).includes(ServerType)) {
        return await message.reply({ embeds: [HelpEmbed] });
    };

    if (Creation.serverTypes[ServerType].isDisabled) {
        return await message.reply("Sorry!!This server type is currently disabled.");
    };

    const ServerCreationSettings = Creation.createParams(
        ServerName,
        ServerType,
        userAccount.consoleID
    );

    Creation.createServer(ServerCreationSettings)
        .then(async (Response) => {
            const Embed = new Discord.EmbedBuilder()
                .setColor(`Green`)
                .setTitle("Server successfully created! 🎉")
                .setDescription(`[Click Here to Access Your Server](${Config.Pterodactyl.hosturl}/server/${Response.data.attributes.identifier})`)
                .addFields(
                    { name: "__**Status:**__", value: Response.statusText.toString(), inline: true },
                    { name: "__**Your ID:**__", value: userAccount.consoleID.toString(), inline: true },
                    { name: "__**Server Type:**__", value: ServerType.toString(), inline: true },
                    { name: "__**Server Name:**__", value: ServerName.toString(), inline: false }
                )
                .setTimestamp()
                .setFooter({ text: "For User: " + message.author.username + ` (${message.author.id})`, iconURL: message.author.avatarURL() });

                await message.reply({ embeds: [Embed] });

        }).catch(async (Error) => {
            const ErrorEmbed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setTimestamp()
                .setFooter({'text': "For User: " + message.author.username + ` (${message.author.id})`, "iconURL": message.author.avatarURL()})


            if (Error == "AxiosError: Request failed with status code 400") {

                    ErrorEmbed.setTitle("Error: Failed to Create a New Server")
                    ErrorEmbed.setDescription("The Node is currently full, Please check <#" + MiscConfigs.serverStatus + "> for updates.\n\nIf there is no updates please alert a System Administrator (<@&" + Config.DiscordBot.Roles.SystemAdmin + ">)")

            } else if (Error == "AxiosError: Request failed with status code 504") {

                    ErrorEmbed.setTitle("Error: Failed to Create a New Server")
                    ErrorEmbed.setDescription("The Node is currently offline or having issues, You can check the status of the node in this channel: <#" + MiscConfigs.serverStatus + ">")

            } else if (Error == "AxiosError: Request failed with status code 429") {

                    ErrorEmbed.setTitle("Error: Failed to Create a New Server");
                    ErrorEmbed.setDescription("You are being rate limited, Please wait a few minutes and try again.");
        
            } else {

                    ErrorEmbed.setTitle("Error: Failed to Create a New Server");
                    ErrorEmbed.setDescription(`Some other issue happened. If this continues please open a ticket and report this to a <@&${Config.DiscordBot.Roles.BotAdmin}> Please share this info with them: \n\n` + "```Error: " + Error + "```");
            }

            //Catch statement added incase of message being deleted before response is sent.
            await message.reply({embeds: [ErrorEmbed]}).catch(Error => {});
        });
};