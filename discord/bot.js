const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const config = require("../config/config");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

module.exports = { client };