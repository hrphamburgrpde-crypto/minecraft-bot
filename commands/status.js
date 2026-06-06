const util = require("minecraft-server-util");
const config = require("../config/config");

async function getStatus() {

    try {

        const status = await util.status(
            config.mcHost,
            config.mcPort
        );

        return {
            online: true,
            players: status.players.online,
            max: status.players.max,
            version: status.version.name
        };

    } catch (error) {

        return {
            online: false
        };
    }
}

module.exports = { getStatus };