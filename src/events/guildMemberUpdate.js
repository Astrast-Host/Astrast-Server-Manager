const Discord = require("discord.js");

const Config = require("../../config.json");

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.GuildMember} oldMember 
 * @param {Discord.GuildMember} newMember 
 * @returns 
 */
module.exports = async (client, oldMember, newMember) => {

    // If the user changes their nickname, check if it breaks any rules.
    if (oldMember.displayName != newMember.displayName) {

        const displayName = newMember.displayName.toLowerCase();

        // Hoisting usernames - No action taken, just check.
        if (displayName.match(/^[a-z0-9]/i) == null) {
            console.log("Detected a hoisting username:", displayName);
        };

        // Banned usernames - No action taken, just check.
        if (Config.BannedNames.some((r) => displayName.includes(r))) {
            console.log("Detected a banned username:", displayName);
        };
    }
};