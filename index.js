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

    const embedText = message.embeds
        .map(embed => [
            embed.title,
            embed.description,
            ...embed.fields.map(field => `${field.name} ${field.value}`)
        ].filter(Boolean).join(" "))
        .join(" ");

    const fullText = `${message.content} ${embedText}`;

    if (fullText.includes("!report ")) {
        const playerMatch = fullText.match(/<([^>]+)>/);

        const reporter = playerMatch
            ? playerMatch[1]
            : (message.member?.displayName || message.author.username || "Unbekannt");

        const reportText = fullText.substring(fullText.indexOf("!report "));
        const args = reportText.split(/\s+/);

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
            new ButtonBuilder()
                .setCustomId(`handled_${reportedPlayer}`)
                .setLabel("Erledigt")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`ignore_${reportedPlayer}`)
                .setLabel("Ignorieren")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`kick_${reportedPlayer}`)
                .setLabel("Kick-Befehl")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`ban_${reportedPlayer}`)
                .setLabel("Ban-Befehl")
                .setStyle(ButtonStyle.Danger)
        );

        await reportChannel.send({
            embeds: [embed],
            components: [buttons]
        });

        return;
    }

    if (message.author.bot) return;

    if (message.content === "!help") {
        return message.channel.send(`
📋 **Befehle**

\`!status\` - Minecraft Server Status
\`!ip\` - Server Adresse
\`!help\` - Diese Hilfe
\`!report SPIELER GRUND\` - Report erstellen
        `);
    }

    if (message.content === "!ip") {
    return message.channel.send(`🌐 **Server-IP:** \`${config.mcHost}:${config.mcPort}\``);
}

// HIER EINFÜGEN
if (message.content === "!setup") {

    const statusMessage = await message.channel.send("⏳ Live-Status wird eingerichtet...");

    const updateLiveStatus = async () => {
        const status = await getStatus();

        let embed;

        if (!status.online) {
            embed = new EmbedBuilder()
                .setColor("#ff3333")
                .setTitle("🔴 PeterSMP Serverstatus")
                .setDescription("Server offline");
        } else {
            embed = new EmbedBuilder()
                .setColor("#00ff88")
                .setTitle("🟢 PeterSMP Serverstatus")
                .addFields(
                    {
                        name: "👥 Spieler",
                        value: `${status.players}/${status.max}`,
                        inline: true
                    },
                    {
                        name: "📦 Version",
                        value: status.version,
                        inline: true
                    }
                )
                .setTimestamp();
        }

        await statusMessage.edit({
            embeds: [embed]
        });
    };

    await updateLiveStatus();

    setInterval(updateLiveStatus, 10000);

    return;
}

// DEIN !status KOMMANDO
if (message.content === "!status") {
        const statusMessage = await message.channel.send("⏳ Lade Serverstatus...");

        const updateStatus = async () => {
            const status = await getStatus();

            let embed;

            if (!status.online) {
                embed = new EmbedBuilder()
                    .setColor("#ff3333")
                    .setTitle("🔴 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist momentan **offline** oder nicht erreichbar.")
                    .addFields(
                        {
                            name: "🌐 Adresse",
                            value: `\`${config.mcHost}:${config.mcPort}\``,
                            inline: false
                        },
                        {
                            name: "🔄 Aktualisierung",
                            value: "Alle 5 Sekunden für 60 Sekunden",
                            inline: false
                        }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp();
            } else {
                embed = new EmbedBuilder()
                    .setColor("#00ff88")
                    .setTitle("🟢 PeterSMP Serverstatus")
                    .setDescription("Der Minecraft-Server ist aktuell **online**.")
                    .addFields(
                        {
                            name: "👥 Spieler",
                            value: `**${status.players}/${status.max}**`,
                            inline: true
                        },
                        {
                            name: "📦 Version",
                            value: `**${status.version || "Unbekannt"}**`,
                            inline: true
                        },
                        {
                            name: "🌐 Adresse",
                            value: `\`${config.mcHost}:${config.mcPort}\``,
                            inline: false
                        },
                        {
                            name: "🔄 Aktualisierung",
                            value: "Alle 5 Sekunden für 60 Sekunden",
                            inline: false
                        }
                    )
                    .setFooter({ text: "PeterSMP • Live Status" })
                    .setTimestamp();
            }

            await statusMessage.edit({
                content: "",
                embeds: [embed]
            });
        };

        await updateStatus();

        const interval = setInterval(async () => {
            try {
                await updateStatus();
            } catch (error) {
                clearInterval(interval);
            }
        }, 5000);

        setTimeout(() => {
            clearInterval(interval);
        }, 60000);

        return;
    }
});

client.on("interactionCreate", async (interaction) => {
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
            content:
                `⚠️ Kick-Befehl für **${player}**\n` +
                `\`\`\`\n/kick ${player} Report geprüft\n\`\`\``,
            ephemeral: true
        });
    }

    if (action === "ban") {
        return interaction.reply({
            content:
                `⚠️ Ban-Befehl für **${player}**\n` +
                `\`\`\`\n/ban ${player} Report geprüft\n\`\`\``,
            ephemeral: true
        });
    }
});

client.login(config.discordToken);