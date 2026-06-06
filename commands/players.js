const { execute } = require("../minecraft/rcon");

async function getPlayers() {
    return await execute("list");
}

module.exports = { getPlayers };