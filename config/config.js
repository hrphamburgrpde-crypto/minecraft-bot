require("dotenv").config();

module.exports = {
    discordToken: process.env.DISCORD_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
    reportChannelId: process.env.REPORT_CHANNEL_ID,

    mcHost: process.env.MC_HOST,
    mcPort: parseInt(process.env.MC_PORT)
};