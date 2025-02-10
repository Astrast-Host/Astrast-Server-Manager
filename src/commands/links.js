const Discord = require("discord.js");

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {Array} args 
 * @returns void
 */
exports.run = async (client, message, args) => {
    const LinksEmbed = new Discord.EmbedBuilder()
        .setColor("Blue")

        .addFields(
            {name: "Website", value: "[astrast.com](https://astrast.com)", inline: true},
            {name: "Panel", value: "[panel.astrast.host](https://panel.astrast.host)", inline: true},
        )

    return message.reply({embeds: [LinksEmbed]});
};

exports.description = "Show links to Astrast Hosting services.";
