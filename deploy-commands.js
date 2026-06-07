require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("player_info")
        .setDescription("Zeigt Infos über einen Minecraft-Spieler")
        .addStringOption(option =>
            option
                .setName("username")
                .setDescription("Minecraft Username")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("broadcast")
        .setDescription("Sendet eine Server-Ankündigung")
        .addStringOption(option =>
            option
                .setName("text")
                .setDescription("Die Nachricht")
                .setRequired(true)
        )
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("Slash Commands werden geladen...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log("Slash Commands erfolgreich geladen!");
    } catch (error) {
        console.error(error);
    }
})();