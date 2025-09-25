/*
   * Base WhatsApp Bot (MD) dengan Pairing Code
   * Created by vinss Production
*/

// === Load config global ===
require("./config");
const vinssHandler = require("./vinss");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  jidDecode,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const chalk = require("chalk");
const readline = require("readline");
const { fileTypeFromBuffer } = require('file-type');
const path = require("path");

const pairingCode = true;

// === Database sederhana ===
global.db = global.db || { data: { chats: {}, users: {}, settings: {} } };
if (!global.db.data.rpg) global.db.data.rpg = {};

setInterval(() => {
  try {
    fs.writeFileSync("./database/database.json", JSON.stringify(global.db, null, 2));
  } catch (e) {
    console.error("❌ Gagal menyimpan database:", e);
  }
}, 30_000);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("vinssCreds");
  const { version } = await fetchLatestBaileysVersion();

  const vinss = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !pairingCode,
    auth: state,
    version,
  });

  // === Helper decode jid ===
  vinss.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  // === Pairing Code (jika belum login) ===
  if (pairingCode && !vinss.authState.creds.registered) {
    async function getPhoneNumber() {
      const number = await question("📱 Masukkan nomor WhatsApp (contoh 62xxxx): ");
      const phoneNumber = number.replace(/[^0-9]/g, "");
      if (phoneNumber.length < 9) {
        console.log(chalk.red("❌ Nomor tidak valid, coba lagi"));
        return getPhoneNumber();
      }
      return phoneNumber;
    }

    setTimeout(async () => {
      const phoneNumber = await getPhoneNumber();
      try {
        const code = await vinss.requestPairingCode(phoneNumber);
        console.log(chalk.green(`✅ Pairing Code kamu: ${code}`));
        console.log(
          chalk.yellow("👉 Buka WhatsApp > Linked Devices > Tambahkan perangkat > Masukkan kode di atas")
        );
      } catch (err) {
        console.error(chalk.red("❌ Gagal mendapatkan pairing code. Periksa koneksi atau nomor."));
        process.exit(1);
      }
    }, 3000);
  }

  // === Event pesan masuk ===
  vinss.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      if (!m.message) return;
      if (m.key && m.key.remoteJid === "status@broadcast") return;

      const from = m.key.remoteJid;
      const type = Object.keys(m.message)[0];

      // === Auto save chat ke DB ===
      if (!global.db.data.chats[from]) global.db.data.chats[from] = {};
      global.db.data.chats[from].lastSeen = Date.now();
      global.db.data.chats[from].lastType = type;

      // ambil isi pesan
      let msgBody = "";
      if (m.message.conversation) msgBody = m.message.conversation;
      else if (m.message.extendedTextMessage) msgBody = m.message.extendedTextMessage.text;
      else if (m.message.imageMessage?.caption) msgBody = m.message.imageMessage.caption;
      else if (m.message.videoMessage?.caption) msgBody = m.message.videoMessage.caption;

      // ambil nomor pengirim
      const senderJid = m.key.fromMe ? vinss.user.id : (m.key.participant || m.key.remoteJid);
      const senderNumber = senderJid.split("@")[0];

      // === LOG PESAN DENGAN FORMAT YANG DIMINTA ===
      console.log(chalk.yellow("═".repeat(50)));
      
      // Tentukan jenis chat (private/group)
      const isGroup = from.endsWith("@g.us");
      const chatType = isGroup ? "Group" : "Private";
      
      // Dapatkan nama grup jika group chat
      let groupName = "";
      if (isGroup) {
        try {
          const groupMetadata = await vinss.groupMetadata(from);
          groupName = groupMetadata.subject || "Unknown Group";
        } catch (e) {
          groupName = "Unknown Group";
        }
      }

      // Tampilkan log sesuai format
      console.log(chalk.cyan(`📱 Nomor    : ${senderNumber}`));
      console.log(chalk.cyan(`💬 Pesan    : ${msgBody || "[Media/Non-text message]"}`));
      console.log(chalk.cyan(`👥 Chat/Group : ${isGroup ? `${groupName} (${from})` : 'Private Chat'}`));
      console.log(chalk.cyan(`📊 Tipe     : ${chatType}`));
      console.log(chalk.cyan(`⏰ Waktu    : ${new Date().toLocaleString()}`));
      
      console.log(chalk.yellow("═".repeat(50)));

      // lempar ke handler
      delete require.cache[require.resolve("./vinss")];
      let vinssHandler = require("./vinss");
      await vinssHandler(vinss, m, chatUpdate);
    } catch (err) {
      console.error("❌ Error in messages.upsert:", err);
    }
  });

  // === Event grup welcome/goodbye ===
  vinss.ev.on("group-participants.update", async (anu) => {
    try {
      const groupId = anu.id;
      const action = anu.action;
      const participants = anu.participants || [];

      for (const p of participants) {
        const mentionTag = `@${p.split("@")[0]}`;

        if (action === "add" && global.welcomeMessage) {
          await vinss.sendMessage(groupId, {
            text: global.welcomeMessage.replace("@user", mentionTag),
            mentions: [p],
          });
        } else if (action === "remove" && global.goodbyeMessage) {
          await vinss.sendMessage(groupId, {
            text: global.goodbyeMessage.replace("@user", mentionTag),
            mentions: [p],
          });
        }
      }
    } catch (err) {
      console.error("❌ Error welcome/goodbye:", err);
    }
  });

  // === Event koneksi ===
  vinss.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("❌ Logged out. Hapus folder creds dan login ulang."));
      } else {
        console.log(chalk.yellow("🔄 Reconnecting..."));
        startBot();
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ Connected as " + vinss.user.id));
    }
  });

  // === Event panggilan masuk ===
vinss.ev.on("call", async (callUpdate) => {
  try {
    for (const call of callUpdate) {
      if (call.status === "offer") { 
        const caller = call.from; // jid si penelpon
        console.log(chalk.red(`🚫 Terdeteksi panggilan dari: ${caller}`));

        // Kirim pesan peringatan
        await vinss.sendMessage(caller, { 
          text: "🚫 Maaf, dilarang menelpon bot! Kamu otomatis diblokir." 
        });

        // Blokir nomor
        await vinss.updateBlockStatus(caller, "block");
        console.log(chalk.green(`✅ Nomor ${caller} berhasil diblokir`));
      }
    }
  } catch (err) {
    console.error("❌ Error auto block call:", err);
  }
});


  // === Helper Download & Save Media ===
  vinss.downloadAndSaveMediaMessage = async (message, filename = "temp", attachExtension = true) => {
    try {
      const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        { logger: vinss.logger }
      );

      const type = await fileTypeFromBuffer(buffer);
      const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;

      const savePath = path.join(__dirname, trueFileName);
      fs.writeFileSync(savePath, buffer);
      return savePath;
    } catch (err) {
      console.error("❌ Gagal menyimpan media:", err);
      throw err;
    }
  };

  vinss.ev.on("creds.update", saveCreds);
}

startBot();

// === Hot reload index ===
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.cyanBright(`♻️ Update ${__filename}`));
  delete require.cache[file];
  require(file);
});