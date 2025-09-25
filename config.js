// ==============================
// CONFIGURASI BOT VINSS-MD
// ==============================

const fs = require("fs");
const chalk = require("chalk");

// ==============================
// 🔑 Owner & Info Bot
// ==============================
global.prefix = "."; // Prefix command bot (ubah sesuai keinginan)
global.botName = "VINSSBOTZ"; // Nama bot
global.owner = ["6285380166282"];
global.ownerNumber = global.owner; // alias

// ==============================
// 🔧 State Default
// ==============================
global.selfmode = false; // Public (false) / Self (true)
global.banned = []; // daftar user yang di-ban (array)

// ==============================
// 🛡 Fitur Group
// ==============================
global.antilink = false;
global.antitoxic = false;
global.antispam = false;
global.sniper = false; // auto detect delete
global.autoPromote = false; // auto promote bot ke admin jika tidak admin

// ==============================
// 👋 Welcome & Goodbye
// ==============================
global.welcome = true;
global.goodbye = true;
global.welcomeMessage = "👋 Selamat datang @user di grup ini!";
global.goodbyeMessage = "👋 Selamat tinggal @user, semoga sukses!";

// ==============================
// ⚡ Watermark & Branding
// ==============================
global.wm = "VINSSBOTZ";
global.watermark = global.wm;
global.wm2 = "⫹⫺ Vinss Bot";
global.wm3 = "© Vinss";
global.wm4 = "Made by Vinss Boyz";

// ==============================
// APIKEY
// ==============================
global.APIs = {
  neoxr: "https://api.neoxr.eu/",
  botcahx: "https://api.botcahx.eu.org/"
};

global.APIKeys = {
  "https://api.neoxr.eu/": "exSYfD",
  "https://api.botcahx.eu.org/": "7g7LtR2M"
};

// ==============================
// 📢 Pesan Bot
// ==============================
global.mess = {
  success: "✅ Success",
  done: "✅ Success",
  admin: "⚠ Fitur Khusus Admin Group!",
  botAdmin: "⚠ Bot harus menjadi admin terlebih dahulu!",
  owner: "⚠ Fitur Khusus Owner",
  group: "⚠ Fitur Khusus Group Chat",
  private: "⚠ Fitur Khusus Private Chat!",
  bot: "⚠ Fitur Khusus Nomor Bot",
  wait: "⏳ Sabar ya, sedang diproses...",
  band: "🚫 Kamu telah di-banned oleh owner.\nHubungi owner untuk unban agar bisa menggunakan bot lagi.",
  notregist: "⚠ Kamu belum terdaftar di database bot, silahkan daftar terlebih dahulu!",
  premium: "💎 Kamu bukan user premium. Beli premium ke owner bot!",
  error: "❌ Maaf, fitur sedang error!",
  endLimit: "⚠ Limit harian kamu habis, akan reset otomatis pukul 00:00 WIB.",
};

// ==============================
// 🎭 Sticker Info
// ==============================
global.packname = "Made with";
global.author = "Bot WhatsApp";

// ==============================
// 🖼 Thumbnail
// ==============================
global.thumb = "https://telegra.ph/file/7aee19f90e52a3730f200.jpg";
global.profile = global.thumb; // thumbnail fix

// ==============================
// 📂 Fake Doc Style
// ==============================
global.fake = {
  docs: "application/pdf", // cukup pilih salah satu tipe
  listfakedocs: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
    "application/zip"
  ]
};

// ==============================
// ⏰ Ucapan Waktu
// ==============================
global.ucapanWaktu = (() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Selamat Pagi";
  if (hour >= 12 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
})();

// ==============================
// 🖼 Thumbnail
// ==============================
global.thumb = "./media/thumbnail.png"; // GANTI DENGAN PATH LOKAL
global.profile = global.thumb;
// ==============================
// 🔗 Link & Channel
// ==============================
global.my = {
  ch: "1203632xxxxxxx@newsletter", // JID channel
  chid: "0029VaF4IIt1CYoaRgoOaX2i@newsletter", // Invite code channel
  gh: "https://github.com/vinssbotz" // link github / web
};

// ==============================
// ♻ Auto Reload Config
// ==============================
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.greenBright(`♻️ Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
