const Config = require('../config.json');

const Status = {
        Nodes: {
            "FNodes": {
                pnode1: {
                    Name: "FNode-1",
                    serverID: "7e99f988",
                    IP: Config.Nodes.PNode1,
                    ID: "2",
                    Location: Config.Ping.UK,
                    MaxLimit: 500
                },
            },

            "DNodes": {
                dono01: {
                    Name: "DNode-1",
                    serverID: "bd9d3ad6",
                    IP: Config.Nodes.Dono1,
                    ID: "1",
                    Location: Config.Ping.UK,
                    MaxLimit: 1000
                },
            },
        },

        "VPS's": {
            us1: {
                name: "EU 1",
                IP: Config.Servers.EU1,
                Location: Config.Ping.UK
            }
        },

        "Astrast Services": {
            pterodactylPublic: {
                name: "Pterodactyl (Public)",
                IP: Config.Services.pteropublic,
                Location: Config.Ping.UK
            }
        }
}

module.exports = Status;