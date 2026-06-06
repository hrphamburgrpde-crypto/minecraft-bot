require("dotenv").config();

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const config = require("./config/config");
const { client } = require("./discord/bot");
const { getStatus } = require("./commands/status");

client.once("clientReady", () => {
    console.log("Discord Bot gestartet");
});

client.on("messageCreate", async (message) => {
    if (message.author.bot && !message.content.includes("!report ")) return;

    const fullText = `${message.content}`;

    if (fullText.includes("!report ")) {
        const playerMatch = fullText.match(/<([^>]+)>/);
        const reporter = playerMatch
            ? playerMatch[1]
            : (message.member?.displayName || message.author.username || "Unbekannt");

        const args = fullText.substring(fullText.indexOf("!report ")).split(/\s+/);
        const reportedPlayer = args[1];
        const reason = args.slice(2).join(" ");

        if (!reportedPlayer || !reason) return;

        const reportChannel = await client.channels.fetch(config.reportChannelId);

        const embed = new EmbedBuilder()
            .setTitle("🚨 Neuer Minecraft Report")
            .setColor("#ff3333")
            .addFields(
                { name: "👤 Reporter", value: reporter, inline: true },
                { name: "🎯 Spieler", value: reportedPlayer, inline: true },
                { name: "📝 Grund", value: reason, inline: false },
                { name: "📌 Quelle", value: "Minecraft Chat / DiscordSRV", inline: false }
            )
            .setFooter({ text: "PeterSMP • Report-System" })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`handled_${reportedPlayer}`).setLabel("Erledigt").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`ignore_${reportedPlayer}`).setLabel("Ignorieren").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`kick_${reportedPlayer}`).setLabel("Kick-Befehl").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`ban_${reportedPlayer}`).setLabel("Ban-Befehl").setStyle(ButtonStyle.Danger)
        );

        await reportChannel.send({ embeds: [embed], components: [buttons] });
        return;
    }

    if (message.author.bot) return;

    if (message.content === "!help") {
        return message.channel.send(`
📋 **Befehle**

\`!status\` - Minecraft Server Status
\`!setup\` - Live Status erstellen
\`!ip\` - Server Adresse
\`!help\` - Diese Hilfe
\`!report SPIELER GRUND\` - Report erstellen
        `);
    }

    if (message.content === "!ip") {
        return message.channel.send(`🌐 **Server-IP:** \`${config.mcHost}:${config.mcPort}\``);
    }

    if (message.content === "!setup") {
        const statusMessage = await message.channel.send("⏳ Live-Status wird eingerichtet...");

        const updateLiveStatus = async () => {
            const status = await getStatus();

            const embed = status.online
                ? new EmbedBuilder()
                    .setColor("#00ff88")
                    .setTitle("🟢 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist aktuell **online**.")
                    .addFields(
                        { name: "👥 Spieler", value: `**${status.players}/${status.max}**`, inline: true },
                        { name: "📦 Version", value: `**${status.version || "Unbekannt"}**`, inline: true },
                        { name: "🌐 Adresse", value: `\`${config.mcHost}:${config.mcPort}\``, inline: false },
                        { name: "🔄 Aktualisierung", value: "Alle 10 Sekunden", inline: false }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp()
                : new EmbedBuilder()
                    .setColor("#ff3333")
                    .setTitle("🔴 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist momentan **offline** oder nicht erreichbar.")
                    .addFields(
                        { name: "🌐 Adresse", value: `\`${config.mcHost}:${config.mcPort}\``, inline: false },
                        { name: "🔄 Aktualisierung", value: "Alle 10 Sekunden", inline: false }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp();

            await statusMessage.edit({ content: "", embeds: [embed] });
        };

        await updateLiveStatus();
        setInterval(updateLiveStatus, 10000);
        return;
    }

    if (message.content === "!status") {
        const statusMessage = await message.channel.send("⏳ Lade Serverstatus...");

        const updateStatus = async () => {
            const status = await getStatus();

            const embed = status.online
                ? new EmbedBuilder()
                    .setColor("#00ff88")
                    .setTitle("🟢 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist aktuell **online**.")
                    .addFields(
                        { name: "👥 Spieler", value: `**${status.players}/${status.max}**`, inline: true },
                        { name: "📦 Version", value: `**${status.version || "Unbekannt"}**`, inline: true },
                        { name: "🌐 Adresse", value: `\`${config.mcHost}:${config.mcPort}\``, inline: false },
                        { name: "🔄 Aktualisierung", value: "Alle 10 Sekunden", inline: false }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp()
                : new EmbedBuilder()
                    .setColor("#ff3333")
                    .setTitle("🔴 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist momentan **offline** oder nicht erreichbar.")
                    .addFields(
                        { name: "🌐 Adresse", value: `\`${config.mcHost}:${config.mcPort}\``, inline: false },
                        { name: "🔄 Aktualisierung", value: "Alle 10 Sekunden", inline: false }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp();

            await statusMessage.edit({ content: "", embeds: [embed] });
        };

        await updateStatus();

        const interval = setInterval(updateStatus, 10000);
        return;
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "player_info") {
            await interaction.deferReply();

            const username = interaction.options.getString("username");

            try {
                const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);

                if (!mojangRes.ok) {
                    return interaction.editReply(`❌ Spieler **${username}** wurde nicht gefunden.`);
                }

                const profile = await mojangRes.json();
                const status = await getStatus();

                const embed = new EmbedBuilder()
                    .setColor("#00ff88")
                    .setTitle(`👤 Spielerinfo: ${profile.name}`)
                    .setThumbnail(`https://mc-heads.net/avatar/${profile.name}`)
                    .addFields(
                        { name: "🟢 Status", value: status.online ? "🔴 Offline oder nicht sichtbar" : "⚪ Unbekannt", inline: true },
                        { name: "🆔 UUID", value: `\`${profile.id}\``, inline: false },
                        { name: "🌐 Server", value: `\`${config.mcHost}:${config.mcPort}\``, inline: false }
                    )
                    .setFooter({ text: "PeterSMP • Player Info" })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                return interaction.editReply("❌ Fehler beim Abrufen der Spielerinfo.");
            }
        }

        return;
    }

    if (!interaction.isButton()) return;

    const [action, player] = interaction.customId.split("_");

    if (action === "handled") {
        return interaction.update({
            content: `✅ Report gegen **${player}** wurde als erledigt markiert.`,
            embeds: interaction.message.embeds,
            components: []
        });
    }

    if (action === "ignore") {
        return interaction.update({
            content: `🚫 Report gegen **${player}** wurde ignoriert.`,
            embeds: interaction.message.embeds,
            components: []
        });
    }

    if (action === "kick") {
        return interaction.reply({
            content: `⚠️ Kick-Befehl für **${player}**\n\`\`\`\n/kick ${player} Report geprüft\n\`\`\``,
            ephemeral: true
        });
    }

    if (action === "ban") {
        return interaction.reply({
            content: `⚠️ Ban-Befehl für **${player}**\n\`\`\`\n/ban ${player} Report geprüft\n\`\`\``,
            ephemeral: true
        });
    }
});

client.login(config.discordToken);
