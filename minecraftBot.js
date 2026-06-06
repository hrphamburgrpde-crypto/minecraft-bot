const mc = require("minecraft-protocol");

const client = mc.createClient({
    host: "193.135.10.104",
    port: 15229,
    username: "DiscordBot",
    version: false
});

client.on("connect", () => console.log("TCP verbunden"));
client.on("login", () => console.log("Eingeloggt"));
client.on("spawn", () => console.log("Bot ist gespawnt!"));

client.on("disconnect", (packet) => {
    console.log("Disconnect:", packet);
});

client.on("kick_disconnect", (packet) => {
    console.log("Kick:", packet);
});

client.on("end", (reason) => {
    console.log("Verbindung beendet:", reason);
});

client.on("error", (err) => {
    console.log("Fehler:", err);
});