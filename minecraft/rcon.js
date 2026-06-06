const { Rcon } = require("rcon-client");
const config = require("../config/config");

async function execute(command) {
    const rcon = await Rcon.connect({
        host: config.rconHost,
        port: config.rconPort,
        password: config.rconPassword
    });

    const response = await rcon.send(command);

    await rcon.end();

    return response;
}

module.exports = { execute };