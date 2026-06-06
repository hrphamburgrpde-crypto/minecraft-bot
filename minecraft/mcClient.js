const mc = require("minecraft-protocol");
const config = require("../config/config");

function connect() {

    const client = mc.createClient({
        host: config.mcHost,
        port: config.mcPort,
        username: config.mcUsername
    });

    client.on("chat", packet => {
        console.log(packet);
    });

    client.on("end", () => {
        console.log("Minecraft getrennt");
    });

    return client;
}

module.exports = { connect };