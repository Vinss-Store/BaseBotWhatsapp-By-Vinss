const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const chalk = require("chalk");
const fetch = require("node-fetch"); // untuk clonepp
const {
  pinterest,
  wallpaper,
  wikimedia,
  quotesAnime,
  aiovideodl,
  tiktokDl,
  instagramDl,
  ringtone,
  styletext,
  hitamkan,
  remini,
  mediafireDl
} = require('./lib/scraper');
const { TelegraPh, handleToUrl } = require('./lib/uploader');
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");


const snakeLadder = {};

function getQuotedImage(m) {
  if (m.message?.imageMessage) return m; // kirim gambar langsung
  if (m.quoted && m.quoted.message?.imageMessage) return m.quoted; // reply gambar
  if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage)
    return { message: m.message.extendedTextMessage.contextInfo.quotedMessage };
  return null;
}


async function drawBoard(game) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background board ular tangga
  const board = await loadImage("./media/ulartangga.png"); // gambar papan
  ctx.drawImage(board, 0, 0, size, size);

  // Warna/ikon untuk setiap pemain
  const colors = ["red", "blue", "green", "purple"];
  game.players.forEach((p, i) => {
    const pos = game.positions[p];
    if (pos < 1) return;

    // Hitung koordinat kotak (board 10x10)
    const row = Math.floor((pos - 1) / 10);
    let col = (pos - 1) % 10;
    if (row % 2 === 1) col = 9 - col; // zigzag

    const x = col * (size / 10) + 30;
    const y = size - (row * (size / 10) + 30);

    // Gambar lingkaran sebagai token pemain
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Label nama kecil
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.fillText(i + 1, x - 5, y + 5); // angka pemain
  });

  return canvas.toBuffer();
}


// Tambahan di initRPG
function initRPG(user) {
if (!global.db.data.rpg[user]) {
global.db.data.rpg[user] = {
uang: 1000,
exp: 0,
level: 1,
stamina: 10,
ikan: 0,
daging: 0,
emas: 0,
batu: 0,
lastDaily: 0,
quests: [], // array of active quests
pet: null, // {type: 'anjing', level:1}
marriedTo: null, // nomor pasangan
inventory: {},
};
}
return global.db.data.rpg[user];
}


function checkLevelUp(user, m, vinss) {
// auto level up while exp cukup
let needed = user.level * 100;
let leveled = false;
while (user.exp >= needed) {
user.level += 1;
user.exp -= needed;
user.stamina = 10 + user.level;
needed = user.level * 100;
leveled = true;
}
if (leveled) {
try {
// send message to the same chat if m available
if (m && vinss) {
vinss.sendMessage(m.key.remoteJid, { text: `🎉 Selamat! Kamu naik ke level ${user.level}! Stamina max bertambah!` }, { quoted: m });
}
} catch (e) {
console.error('Error sending levelup message', e);
}
}
}

// ================= WAKTU & GREETING =================
function getUptime() {
const uptime = process.uptime();
const h = Math.floor(uptime / 3600);
const m = Math.floor((uptime % 3600) / 60);
const s = Math.floor(uptime % 60);
return h > 0
? `${h} jam ${m} menit ${s} detik`
: m > 0
? `${m} menit ${s} detik`
: `${s} detik`;
}

const getGreeting = () => {
const hour = new Date().getHours();
if (hour >= 5 && hour < 12) return "Selamat Pagi 🌅";
if (hour >= 12 && hour < 15) return "Selamat Siang ☀";
if (hour >= 15 && hour < 19) return "Selamat Sore 🌇";
return "Selamat Malam 🌙";
};

const formatUptime = (seconds) => {
const d = Math.floor(seconds / 86400);
const h = Math.floor((seconds % 86400) / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = Math.floor(seconds % 60);
return `${d}d ${h}h ${m}m ${s}s`;
};

module.exports = async (vinss, m) => {
try {
// =============================
// 📩 Helper Reply
// =============================
m.reply = async (text) => {
return vinss.sendMessage(m.key.remoteJid, { text }, { quoted: m });
};

// =============================
// 📩 Ambil isi pesan
// =============================
const mtype = Object.keys(m.message)[0];
const body =
mtype === "conversation"
? m.message.conversation
: mtype === "imageMessage"
? m.message.imageMessage.caption
: mtype === "videoMessage"
? m.message.videoMessage.caption
: mtype === "extendedTextMessage"
? m.message.extendedTextMessage.text
: mtype === "buttonsResponseMessage"
? m.message.buttonsResponseMessage.selectedButtonId
: mtype === "listResponseMessage"
? m.message.listResponseMessage.singleSelectReply.selectedRowId
: mtype === "templateButtonReplyMessage"
? m.message.templateButtonReplyMessage.selectedId
: mtype === "messageContextInfo"
? m.message.buttonsResponseMessage?.selectedButtonId ||
m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
""
: "";

const budy = typeof body === "string" ? body.trim() : "";

const prefix = global.prefix;
// ✅ Parsing command dan args lebih aman
let command = null;
let args = [];
if (budy.startsWith(prefix)) {
  const sliced = budy.slice(prefix.length).trim().split(/ +/);
  command = sliced.shift().toLowerCase();
  args = sliced;
}
const q = args.join(" ");

if (!command) return; // bukan command

// =============================
// 👤 Info Pengirim
// =============================
const from = m.key.remoteJid;
const botNumber = vinss.decodeJid(vinss.user.id);
const isGroup = from.endsWith("@g.us");

const sender = m.key.fromMe
? botNumber
: isGroup
? vinss.decodeJid(m.key.participant || m.participant)
: vinss.decodeJid(m.key.remoteJid);

// filter nomor agar valid
const rawNumber = sender.split("@")[0];
const senderNumber = rawNumber.startsWith("62")
? rawNumber
: rawNumber.replace(/\D/g, "");

// =============================
// 👥 Info Grup
// =============================
let groupMetadata = {};
let groupOwner = "";
let groupAdmins = [];

if (isGroup) {
groupMetadata = await vinss.groupMetadata(from).catch(() => ({}));
groupOwner = groupMetadata.owner || "";
groupAdmins = groupMetadata.participants
? groupMetadata.participants
.filter((p) => p.admin !== null)
.map((p) => p.id)
: [];
}

const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
const isGroupOwner = isGroup ? sender === groupOwner : false;
const isBotOwner = global.owner.includes(senderNumber);
const isOwner = isBotOwner;

//================= CEK FUNGSI ====================//
// ...existing code...
if (
  isGroup &&
  global.db.data.chats[from]?.antilink &&
  !isAdmins &&
  !isOwner &&
  !isGroupOwner
) {
  // Deteksi link (regex sederhana)
  const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
  if (linkRegex.test(budy)) {
    if (groupAdmins.includes(botNumber)) {
      try {
        console.log('[ANTILINK] Akan hapus pesan:');
        console.log('remoteJid:', from);
        console.log('id:', m.key.id);
        console.log('participant:', m.key.participant || sender);
        console.log('fromMe:', false);
        await vinss.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant || sender,
          },
        });
        console.log('[ANTILINK] Selesai hapus pesan:');
        console.log('remoteJid:', from);
        console.log('id:', m.key.id);
        console.log('participant:', m.key.participant || sender);
        console.log('fromMe:', false);
        console.log("✅ Pesan link berhasil dihapus!");
      } catch (e) {
        console.error("❌ Gagal hapus pesan antilink:", e);
      }
    } else {
      console.log("⚠️ Bot bukan admin, tidak bisa hapus pesan!");
    }
    return; 
  }
  }




// =============================
// 📜 Log
// =============================
console.log(
chalk.cyan(
`👉 Cmd: ${command} | From: ${senderNumber} | Owner: ${isOwner} | Admin: ${isAdmins} | GroupOwner: ${isGroupOwner} | Group: ${isGroup}`
)
);

// =============================
// 🔧 Command Handler
// =============================
switch (command) {
case "menu": {
let greeting = getGreeting();
let uptime = getUptime();
let menuText = `
${greeting}, @${senderNumber} 👋
🤖 *${global.botName}* Aktif selama: ${uptime}

📌 *List Fitur Bot:*

╭─❒ *OWNER MENU*
│ • ${prefix}addowner <nomor>
│ • ${prefix}delowner <nomor>
│ • ${prefix}listowner
│ • ${prefix}setname <nama>
│ • ${prefix}setbio <bio>
│ • ${prefix}setpp
│ • ${prefix}clonepp @tag
│ • ${prefix}shutdown
│ • ${prefix}restart
│ • ${prefix}evaljs <code>
│ • ${prefix}bc <teks>
│ • ${prefix}getdb
│ • ${prefix}getsession
╰❒

╭─❒ *GROUP MENU*
│ • ${prefix}kick @tag
│ • ${prefix}add <nomor>
│ • ${prefix}promote @tag
│ • ${prefix}demote @tag
│ • ${prefix}tagall
│ • ${prefix}hidetag <teks>
│ • ${prefix}setname <nama>
│ • ${prefix}setdesc <desc>
│ • ${prefix}setppgc
│ • ${prefix}linkgc
│ • ${prefix}revoke
│ • ${prefix}listadmin
│ • ${prefix}antilink on/off
│ • ${prefix}welcome
│ • ${prefix}onlyadmin
│ • ${prefix}opengroup
│ • ${prefix}mute / ${prefix}unmute
│ • ${prefix}antispam
│ • ${prefix}groupinfo
╰❒

╭─❒ *TOOLS MENU*
│ • ${prefix}shortlink <url>
│ • ${prefix}translate <lang> <teks>
│ • ${prefix}removebg (reply foto)
│ • ${prefix}tourl (reply foto)
│ • ${prefix}webp2mp4 (reply stiker)
│ • ${prefix}ssweb <url>
│ • ${prefix}readqr (reply QR)
╰❒

╭─❒ *DOWNLOADER / MEDIA*
│ • ${prefix}pinterest <query>
│ • ${prefix}wallpaper <query>
│ • ${prefix}wikimedia <query>
│ • ${prefix}quotesanime
│ • ${prefix}aiovideodl <url>
│ • ${prefix}igstalk <username>
╰❒

╭─❒ *RPG MENU*
│ • ${prefix}profile
│ • ${prefix}work
│ • ${prefix}fish
│ • ${prefix}hunt
│ • ${prefix}mine
│ • ${prefix}sell
│ • ${prefix}rest
│ • ${prefix}inv
│ • ${prefix}adventure
│ • ${prefix}daily
│ • ${prefix}gacha
│ • ${prefix}casino <jumlah>
│ • ${prefix}heal
│ • ${prefix}quest
│ • ${prefix}dungeon
│ • ${prefix}adopt <jenis>
│ • ${prefix}pet
│ • ${prefix}upgradepet
│ • ${prefix}craft <item>
│ • ${prefix}trade @user <jumlah>
│ • ${prefix}top
│ • ${prefix}marry @user
│ • ${prefix}divorce
│ • ${prefix}ojek
╰❒


ℹ️ Gunakan prefix: *${prefix}* sebelum command.
`;

await vinss.sendMessage(
from,
{
image: { url: global.thumb }, // ✅ thumbnail dari config
caption: menuText,
mentions: [sender],
},
{ quoted: m }
);
}
break;


case "owner":
for (let no of global.owner) {
await vinss.sendMessage(from, {
contacts: {
displayName: no,
contacts: [
{
vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Owner Bot\nTEL;type=CELL;type=VOICE;waid=${no}:+${no}\nEND:VCARD`,
},
],
},
});
}
break;

//================= OWNER MENU =================//
case "addowner":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let newOwner = budy.split(" ")[1];
if (!newOwner) return m.reply("⚠ Masukkan nomor!\nContoh: .addowner 628xxx");
if (!global.owner.includes(newOwner)) {
global.owner.push(newOwner);
m.reply(`✅ Nomor ${newOwner} berhasil ditambahkan ke daftar owner!`);
} else {
m.reply("⚠ Nomor sudah ada di daftar owner!");
}
break;

case "delowner":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let delNumber = budy.split(" ")[1];
if (!delNumber) return m.reply("⚠ Masukkan nomor!\nContoh: .delowner 628xxx");
global.owner = global.owner.filter((no) => no !== delNumber);
m.reply(`✅ Nomor ${delNumber} berhasil dihapus dari daftar owner!`);
break;

case "listowner":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let list = global.owner.map((o, i) => `${i + 1}. ${o}`).join("\n");
m.reply(`👑 *Daftar Owner Bot:*\n\n${list}`);
break;

case "leave":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!isGroup) return m.reply(global.mess.group);
await vinss.groupLeave(from);
break;

case "setname":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let newName = budy.slice(command.length + 1);
if (!newName) return m.reply("⚠ Masukkan nama baru!");
await vinss.updateProfileName(newName);
m.reply(`✅ Nama bot berhasil diubah menjadi *${newName}*`);
break;

case "setbio":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let newBio = budy.slice(command.length + 1);
if (!newBio) return m.reply("⚠ Masukkan bio baru!");
await vinss.updateProfileStatus(newBio);
m.reply(`✅ Bio bot berhasil diubah menjadi:\n${newBio}`);
break;

case "setpp":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.setpp*");

try {
// ambil buffer media dengan downloadMediaMessage dari baileys
const media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });

if (isGroup) {
// update foto grup
await vinss.updateProfilePicture(from, media);
m.reply("✅ Foto profil grup berhasil diganti!");
} else {
// update foto bot
await vinss.updateProfilePicture(botNumber, media);
m.reply("✅ Foto profil bot berhasil diganti!");
}
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengganti foto profil!");
}
break;



case "shutdown":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await m.reply("👋 Bot dimatikan...");
process.exit(0);
break;

case "bc": // broadcast pesan ke semua chat
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!budy.slice(command.length + 1))
return m.reply("⚠ Masukkan teks broadcast!");
let teks = budy.slice(command.length + 1);
let chats = Object.keys(global.db.data.chats);
m.reply(`📢 Mengirim broadcast ke ${chats.length} chat...`);
for (let id of chats) {
await vinss.sendMessage(id, { text: `📢 *Broadcast*\n\n${teks}` });
}
break;

case "setpp":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.setpp*");

try {
const media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });

if (isGroup) {
await vinss.updateProfilePicture(from, media); // ✅ ganti pp grup
m.reply("✅ Foto profil grup berhasil diganti!");
} else {
await vinss.updateProfilePicture(botNumber, media); // ✅ ganti pp bot
m.reply("✅ Foto profil bot berhasil diganti!");
}
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengganti foto profil!");
}
break;

case "clonepp":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);

const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
if (!mentionedJid.length) return m.reply("⚠ Tag user untuk clone foto profil!");

try {
let target = mentionedJid[0];
let ppUrl = await vinss.profilePictureUrl(target, "image").catch(() => null);

if (!ppUrl) return m.reply("❌ User tidak punya foto profil!");
let buffer = await fetch(ppUrl).then((res) => res.buffer());

await vinss.updateProfilePicture(botNumber, buffer); // ✅ set pp bot
m.reply("✅ Foto profil bot berhasil diganti!");
} catch (e) {
console.error("❌ Error clonepp:", e);
m.reply("❌ Gagal clone foto profil!");
}
break;


case "getdb":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await vinss.sendMessage(
from,
{
document: fs.readFileSync("./database/database.json"),
mimetype: "application/json",
fileName: "database.json",
},
{ quoted: m }
);
break;

case "sysinfo":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
const os = require("os");
let uptime = (os.uptime() / 3600).toFixed(1);
let mem = (os.totalmem() - os.freemem()) / 1024 / 1024;
let total = os.totalmem() / 1024 / 1024;
m.reply(
`🖥 *System Info*\n\n` +
`• Platform: ${os.platform()}\n` +
`• Arch: ${os.arch()}\n` +
`• CPU: ${os.cpus()[0].model}\n` +
`• RAM: ${mem.toFixed(1)}MB / ${total.toFixed(1)}MB\n` +
`• Uptime: ${uptime} jam`
);
break;

case "restart":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await m.reply("♻️ Bot akan restart...");
process.exit(1);
break;

case "evaljs":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let code = budy.slice(command.length + 1);
if (!code) return m.reply("⚠ Masukkan kode JavaScript!");
try {
let result = eval(code);
m.reply(`✅ Hasil:\n${result}`);
} catch (e) {
m.reply(`❌ Error:\n${e}`);
}
break;

case "leaveall":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let groups = Object.keys(global.db.data.chats).filter((id) =>
id.endsWith("@g.us")
);
m.reply(`🚪 Keluar dari ${groups.length} grup...`);
for (let id of groups) {
await vinss.groupLeave(id);
}
break;

case "getsession":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await vinss.sendMessage(
from,
{
document: fs.readFileSync("./vinssCreds/creds.json"),
mimetype: "application/json",
fileName: "session.json",
},
{ quoted: m }
);
break;

case "ssweb":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let url = budy.split(" ")[1];
if (!url)
return m.reply("⚠ Masukkan URL!\nContoh: .ssweb https://google.com");
try {
let ss = await fetch(`https://image.thum.io/get/fullpage/${url}`);
let buffer = await ss.buffer();
await vinss.sendMessage(
from,
{ image: buffer, caption: `📸 Screenshot dari ${url}` },
{ quoted: m }
);
} catch {
m.reply("❌ Gagal mengambil screenshot!");
}
break;

case "readqr":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!m.message.imageMessage)
return m.reply(
"⚠ Kirim/Reply gambar QR code dengan caption *.readqr*"
);
try {
let buffer = await vinss.downloadMediaMessage(m);
const qrcode = require("qrcode-reader");
const Jimp = require("jimp");
const image = await Jimp.read(buffer);
let qr = new qrcode();
qr.callback = (err, value) => {
if (err || !value) return m.reply("❌ Tidak bisa membaca QR!");
m.reply(`✅ QR Content:\n${value.result}`);
};
qr.decode(image.bitmap);
} catch {
m.reply("❌ Error membaca QR!");
}
break;

case "block":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!m.mentionedJid || !m.mentionedJid[0])
return m.reply("⚠ Tag user yang mau diblock!");
await vinss.updateBlockStatus(m.mentionedJid[0], "block");
m.reply("✅ User berhasil diblock!");
break;

case "unblock":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
if (!m.mentionedJid || !m.mentionedJid[0])
return m.reply("⚠ Tag user yang mau diunblock!");
await vinss.updateBlockStatus(m.mentionedJid[0], "unblock");
m.reply("✅ User berhasil diunblock!");
break;

case "clearall":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let chatsClear = Object.keys(global.db.data.chats);
for (let id of chatsClear) {
delete global.db.data.chats[id];
}
m.reply("🗑 Semua chat berhasil dihapus dari database bot!");
break;

case "uptime":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let up = process.uptime();
let h = Math.floor(up / 3600);
let mnt = Math.floor((up % 3600) / 60);
let sc = Math.floor(up % 60);
m.reply(`⏱ Bot Uptime: ${h} jam ${mnt} menit ${sc} detik`);
break;

case "join":
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let link = budy.split(" ")[1];
if (!link) return m.reply("⚠ Masukkan link grup!");
let invite = link.split("https://chat.whatsapp.com/")[1];
if (!invite) return m.reply("❌ Link tidak valid!");
await vinss.groupAcceptInvite(invite);
m.reply("✅ Bot berhasil join grup!");
break;
//================= MAKER MENU =================//
case "iqc": {
  if (!q) return m.reply("⚠️ Masukkan teks untuk IQC maker!\nContoh: .iqc Love");

  try {
    let base = global.APIs.botcahx;
    let key = global.APIKeys[base];
    let apiUrl = `${base}api/maker/iqc?text=${encodeURIComponent(q)}&apikey=${key}`;

    let res = await fetch(apiUrl);
    let data = await res.json();

    console.log("DEBUG IQC =>", data);

    if (!data.status || !data.result) {
      return m.reply("❌ Gagal membuat IQC image!");
    }

    let imageUrl = data.result; // tergantung format respons; bisa `data.result.image`, atau langsung URL

    await vinss.sendMessage(
      from,
      {
        image: { url: imageUrl },
        caption: `✨ IQC Maker: ${q}`
      },
      { quoted: m }
    );
  } catch (e) {
    console.error("❌ Error iqc:", e);
    m.reply("❌ Terjadi kesalahan saat membuat IQC image!");
  }
}
break;

case "brat": {
  if (!q) return m.reply("⚠️ Masukkan teks untuk Brat Maker!\nContoh: .brat Love");

  try {
    let base = global.APIs.botcahx;
    let key = global.APIKeys[base];
    let apiUrl = `${base}api/maker/brat?text=${encodeURIComponent(q)}&apikey=${key}`;

    // langsung kirim tanpa parse JSON
    await vinss.sendMessage(
      from,
      {
        image: { url: apiUrl },
        caption: `🎨 Brat Maker: ${q}`
      },
      { quoted: m }
    );

  } catch (e) {
    console.error("❌ Error brat:", e);
    m.reply("❌ Terjadi kesalahan saat membuat Brat image!");
  }
}
break;
//================= GROUP MENU =================//
case "kick":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid)
return m.reply("⚠ Tag member yang mau dikeluarkan!");
for (let jid of m.message.extendedTextMessage.contextInfo.mentionedJid) {
await vinss.groupParticipantsUpdate(from, [jid], "remove");
}
m.reply("✅ Member berhasil dikeluarkan!");
break;

case "add":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let nomor = budy.split(" ")[1];
if (!nomor) return m.reply("⚠ Masukkan nomor!\nContoh: .add 628xxx");
try {
await vinss.groupParticipantsUpdate(from, [`${nomor}@s.whatsapp.net`], "add");
m.reply(`✅ Berhasil menambahkan ${nomor}`);
} catch (e) {
m.reply("❌ Gagal menambahkan user!");
}
break;

case "promote":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid)
return m.reply("⚠ Tag member yang mau dijadikan admin!");
for (let jid of m.message.extendedTextMessage.contextInfo.mentionedJid) {
await vinss.groupParticipantsUpdate(from, [jid], "promote");
}
m.reply("✅ Berhasil promote!");
break;

case "demote":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid)
return m.reply("⚠ Tag admin yang mau diturunkan!");
for (let jid of m.message.extendedTextMessage.contextInfo.mentionedJid) {
await vinss.groupParticipantsUpdate(from, [jid], "demote");
}
m.reply("✅ Berhasil demote!");
break;

case "tagall":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let teksTag = `📢 *Tag All* oleh Admin\n\n`;
for (let mem of groupMetadata.participants) {
teksTag += `@${mem.id.split("@")[0]}\n`;
}
await vinss.sendMessage(from, { text: teksTag, mentions: groupMetadata.participants.map(p => p.id) }, { quoted: m });
break;

case "hidetag":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let htText = budy.slice(command.length + 1);
if (!htText) return m.reply("⚠ Masukkan teks untuk hidetag!");
await vinss.sendMessage(from, { text: htText, mentions: groupMetadata.participants.map(p => p.id) }, { quoted: m });
break;

case "setname":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let newGcName = budy.slice(command.length + 1);
if (!newGcName) return m.reply("⚠ Masukkan nama grup baru!");
await vinss.groupUpdateSubject(from, newGcName);
m.reply(`✅ Nama grup berhasil diubah menjadi *${newGcName}*`);
break;

case "setdesc":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let newDesc = budy.slice(command.length + 1);
if (!newDesc) return m.reply("⚠ Masukkan deskripsi baru!");
await vinss.groupUpdateDescription(from, newDesc);
m.reply("✅ Deskripsi grup berhasil diubah!");
break;

case "setppgc":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.setppgc*");
try {
const media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });
await vinss.updateProfilePicture(from, media);
m.reply("✅ Foto profil grup berhasil diganti!");
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengganti foto grup!");
}
break;

case "linkgc":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let inviteCode = await vinss.groupInviteCode(from);
m.reply(`🔗 *Link Group:*\nhttps://chat.whatsapp.com/${inviteCode}`);
break;

case "revoke":
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await vinss.groupRevokeInvite(from);
m.reply("✅ Link grup berhasil direset!");
break;

case "listadmin":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
let listAdmin = groupAdmins.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
m.reply(`👑 *Daftar Admin Grup:*\n\n${listAdmin}`, { mentions: groupAdmins });
break;

case "antilink": {
  if (!isGroup) return m.reply("❌ Fitur hanya untuk grup!");
  if (!isAdmins && !isOwner && !isGroupOwner)
    return m.reply("❌ Hanya admin grup / owner bot yang bisa pakai command ini!");

  if (!global.db.data.chats[from]) global.db.data.chats[from] = {};

  if (args[0] === "on") {
    global.db.data.chats[from].antilink = true;
    m.reply("✅ Antilink berhasil *AKTIF* di grup ini!");
  } else if (args[0] === "off") {
    global.db.data.chats[from].antilink = false;
    m.reply("❌ Antilink berhasil *NONAKTIF* di grup ini!");
  } else {
    let status = global.db.data.chats[from].antilink ? "AKTIF" : "NONAKTIF";
    m.reply(`ℹ️ Gunakan: ${prefix}antilink on / off\n📌 Status sekarang: *${status}*`);
  }
}
break;

// Only Admin (hanya admin bisa kirim pesan)
case "onlyadmin":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa aktifkan!");
await vinss.groupSettingUpdate(from, "announcement");
m.reply("✅ Sekarang hanya admin yang bisa kirim pesan di grup!");
break;

// Open Group (buka chat untuk semua)
case "opengroup":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa buka!");
await vinss.groupSettingUpdate(from, "not_announcement");
m.reply("✅ Grup sudah dibuka, semua member bisa chat!");
break;

// Mute Bot (bot ignore semua pesan di grup)
case "mute":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa mute!");
global.db.data.chats[from].mute = true;
m.reply("🤐 Bot dimute di grup ini!");
break;

case "unmute":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa unmute!");
global.db.data.chats[from].mute = false;
m.reply("✅ Bot sudah aktif kembali di grup ini!");
break;

// Welcome ON/OFF
case "welcome":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa set welcome!");
global.db.data.chats[from].welcome = !global.db.data.chats[from].welcome;
m.reply(`✅ Welcome message sekarang: *${global.db.data.chats[from].welcome ? "AKTIF" : "NONAKTIF"}*`);
break;

// Auto Kick Member yang SPAM (rare)
case "antispam":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa aktifkan!");
global.db.data.chats[from].antispam = !global.db.data.chats[from].antispam;
m.reply(`✅ Anti-Spam sekarang: *${global.db.data.chats[from].antispam ? "AKTIF" : "NONAKTIF"}*`);
break;

// Group Info Lengkap
case "groupinfo":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
let info = `📌 *Group Info* 📌
• Nama: ${groupMetadata.subject}
• ID: ${from}
• Dibuat: ${new Date(groupMetadata.creation * 1000).toLocaleString()}
• Owner: ${groupOwner ? "@" + groupOwner.split("@")[0] : "Tidak ada"}
• Member: ${groupMetadata.participants.length}
• Admin: ${groupAdmins.length}`;
m.reply(info, { mentions: [groupOwner, ...groupAdmins] });
break;

// Lock Group (tidak bisa tambah/hapus member)
case "lockgroup":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa lock!");
await vinss.groupSettingUpdate(from, "locked");
m.reply("🔒 Grup berhasil dikunci (tidak bisa tambah/hapus member).");
break;

case "unlockgroup":
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa unlock!");
await vinss.groupSettingUpdate(from, "unlocked");
m.reply("🔓 Grup berhasil dibuka kembali.");
break;

//================= TOLS MENU =================//
case "remini": {
  if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.remini*");

  try {
    let media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });
    let buffer = await remini(media, "recolor"); // bisa juga 'enhance', 'recolor'
    await vinss.sendMessage(from, { image: buffer, caption: "✅ Hasil Remini" }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal proses remini!");
  }
}
break;

case "styletext": {
  if (!q) return m.reply("⚠ Masukkan teks!\nContoh: .styletext hello");

  try {
    let styles = await styletext(q);
    let teks = "✨ *Hasil StyleText:*\n\n";
    styles.forEach((s, i) => {
      teks += `${i+1}. ${s.name}\n${s.result}\n\n`;
    });
    m.reply(teks);
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal ambil styletext!");
  }
}
break;

case "hitamkan": {
  if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.hitamkan*");

  try {
    let media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });
    let buffer = await hitamkan(media, "coklat"); // filter bisa ganti
    await vinss.sendMessage(from, { image: buffer, caption: "✅ Hasil Filter Hitamkan" }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal hitamkan foto!");
  }
}
break;

case "ringtone": {
  if (!q) return m.reply("⚠ Masukkan judul ringtone!\nContoh: .ringtone iphone");

  try {
    let res = await ringtone(q);
    if (!res.length) return m.reply("❌ Tidak ditemukan!");

    let pick = res[0]; // ambil pertama
    await vinss.sendMessage(from, {
      audio: { url: pick.audio },
      mimetype: "audio/mp4",
      fileName: `${pick.title}.mp3`,
      caption: `🎶 *Ringtone*\n📌 Judul: ${pick.title}\n🔗 ${pick.source}`
    }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal ambil ringtone!");
  }
}
break;


case "shortlink":
if (!args[0]) return m.reply("⚠ Masukkan link!\nContoh: .shortlink https://google.com");
try {
let short = `https://tinyurl.com/api-create.php?url=${args[0]}`;
let res = await fetch(short);
let link = await res.text();
m.reply(`🔗 *Link Asli:* ${args[0]}\n➡️ *Shortlink:* ${link}`);
} catch {
m.reply("❌ Gagal membuat shortlink!");
}
break;

case "translate":
if (args.length < 2) return m.reply("⚠ Format: .translate <kode_bahasa> <teks>\nContoh: .translate en selamat pagi");
const lang = args[0];
const teksTr = args.slice(1).join(" ");
try {
const translate = require("@vitalets/google-translate-api");
let result = await translate(teksTr, { to: lang });
m.reply(`🌍 *Translate:*\nDari: ${teksTr}\nKe [${lang}]: ${result.text}`);
} catch (e) {
console.error(e);
m.reply("❌ Gagal translate!");
}
break;

case "removebg":
if (!m.message.imageMessage) return m.reply("⚠ Kirim/reply foto dengan caption *.removebg*");
try {
const { removeBackgroundFromImageBase64 } = require("remove.bg");
let media = await downloadMediaMessage(m, "buffer", {}, { logger: vinss.logger });

// convert buffer ke base64
let base64Img = media.toString("base64");

let result = await removeBackgroundFromImageBase64({
base64img: base64Img,
apiKey: "free", // bisa pake "free" atau daftarin API key (gratis quota)
size: "auto",
type: "auto",
});

let buffer = Buffer.from(result.base64img, "base64");
await vinss.sendMessage(from, { image: buffer, caption: "✅ Background berhasil dihapus!" }, { quoted: m });
} catch (e) {
console.error(e);
m.reply("❌ Gagal menghapus background!");
}
break;


case "igstalk":
if (!args[0]) return m.reply("⚠ Masukkan username IG!\nContoh: .igstalk arielnoah");
try {
let res = await fetch(`https://api.popcat.xyz/instagram?user=${args[0]}`);
let data = await res.json();
m.reply(`📸 *Instagram Stalker*\n
👤 Nama: ${data.full_name}
🔖 Username: ${data.username}
👥 Followers: ${data.followers}
👥 Following: ${data.following}
📌 Bio: ${data.biography}`);
} catch (e) {
console.error(e);
m.reply("❌ Username tidak ditemukan!");
}
break;

case "ssweb":
if (!args[0]) return m.reply("⚠ Masukkan URL!\nContoh: .ssweb https://google.com");
try {
let ss = await fetch(`https://image.thum.io/get/fullpage/${args[0]}`);
let buffer = await ss.buffer();
await vinss.sendMessage(from, { image: buffer, caption: `📸 Screenshot dari ${args[0]}` }, { quoted: m });
} catch {
m.reply("❌ Gagal mengambil screenshot!");
}
break;

case 'tourl': {
const mime =
m.message?.imageMessage?.mimetype ||
m.quoted?.message?.imageMessage?.mimetype ||
m.quoted?.mimetype ||
m.mimetype ||
'';

if (!/image/.test(mime)) {
return m.reply('⚠ Kirim atau balas gambar dengan caption *.tourl*');
}

await m.reply('⏳ Mengunggah media...');
const targetMsg = m.quoted && /image/.test(mime) ? m.quoted : m;

let mediaPath;
try {
mediaPath = await vinss.downloadAndSaveMediaMessage(targetMsg, 'upload');
} catch (err) {
console.error('❌ Gagal download:', err);
return m.reply('❌ Gagal mengunduh media!');
}

const result = await handleToUrl(mediaPath);
fs.unlinkSync(mediaPath);

if (!result.success) {
return m.reply(`❌ Upload gagal: ${result.error}`);
}

m.reply(`✅ *Berhasil Upload via ${result.service}*\n🔗 ${result.url}`);
break;
}



case 'webp2mp4': {
if (!m.quoted) return m.reply('⚠ Balas stiker WEBP dengan caption *.webp2mp4*');
const quoted = m.quoted ? m.quoted : m;
const mime = (quoted.msg || quoted).mimetype || '';
if (!/webp/.test(mime)) return m.reply('❌ Format salah. Balas stiker *WEBP*!');

const mediaPath = await vinss.downloadAndSaveMediaMessage(quoted);
try {
const result = await webp2mp4File(mediaPath);
if (!result || !result.result) return m.reply('❌ Konversi gagal.');
await vinss.sendMessage(from, { video: { url: result.result }, caption: '✅ Konversi berhasil!' }, { quoted: m });
} catch (e) {
console.error(e);
m.reply('❌ Terjadi kesalahan saat konversi WEBP ke MP4.');
} finally {
if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
}
}
break;

//================= DOWNLOADER ==================//
case "tiktok": {
  if (!q) return m.reply("⚠ Masukkan URL TikTok!\nContoh: .tiktok https://vt.tiktok.com/xxxx");

  try {
    const result = await tiktokDl(q); // ✅ pakai scraper lokal

    if (!result.status) {
      return m.reply("❌ Gagal mengambil data TikTok!");
    }

    // Ambil video no watermark HD kalau ada, fallback ke yang lain
    let videoUrl = null;
    let caption = `🎬 *TikTok Downloader*\n\n📌 Judul: ${result.title}\n👤 Author: ${result.author.nickname} (@${result.author.fullname})\n\n👀 Views: ${result.stats.views}\n❤️ Likes: ${result.stats.likes}\n💬 Komentar: ${result.stats.comment}\n🔄 Share: ${result.stats.share}\n⬇️ Download: ${result.stats.download}\n\n🎵 Musik: ${result.music_info.title} - ${result.music_info.author}`;

    const vidNowm = result.data.find(v => v.type === "nowatermark_hd")
                  || result.data.find(v => v.type === "nowatermark")
                  || result.data.find(v => v.type === "watermark");

    if (vidNowm) {
      videoUrl = vidNowm.url;
    }

    if (videoUrl) {
      await vinss.sendMessage(
        from,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption,
        },
        { quoted: m }
      );
    } else if (result.data.some(v => v.type === "photo")) {
      // Kalau post TikTok berupa foto slide
      for (let img of result.data.filter(v => v.type === "photo")) {
        await vinss.sendMessage(from, { image: { url: img.url }, caption }, { quoted: m });
      }
    } else {
      m.reply("❌ Tidak ada media yang bisa diunduh!");
    }
  } catch (e) {
    console.error("❌ Error TikTok:", e);
    m.reply("❌ Terjadi kesalahan saat download TikTok!");
  }
}
break;

case "instagram": {
  if (!q) return m.reply("⚠ Masukkan URL Instagram!\nContoh: .instagram https://www.instagram.com/reel/xxxx");

  try {
    let res = await instagramDl(q);
    if (!res.length) return m.reply("❌ Tidak ada media yang bisa diunduh!");

    for (let item of res) {
      await vinss.sendMessage(from, { video: { url: item.url }, caption: `📸 ${item.title}` }, { quoted: m });
    }
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal download Instagram!");
  }
}
break;

case "telesticker":
case "telestik": {
  if (!q) return m.reply("⚠️ Masukkan URL sticker Telegram!\nContoh: .telesticker https://t.me/addstickers/NamaStickerPack");

  try {
    let base = global.APIs.botcahx;
    let key = global.APIKeys[base];
    let apiUrl = `${base}api/dowloader/telesticker?url=${encodeURIComponent(q)}&apikey=${key}`;

    let res = await fetch(apiUrl);
    let data = await res.json();

    console.log("DEBUG TELESTICKER =>", data);

    if (!data.status || !data.result || !Array.isArray(data.result)) {
      return m.reply("❌ Gagal mengambil sticker pack Telegram!");
    }

    let caption = `📦 *Telegram Sticker Pack*
📌 Total Sticker: ${data.result.length}`;

    await vinss.sendMessage(from, { text: caption }, { quoted: m });

    // Kirim semua stiker (dibatasi biar WA gak flood)
    let limit = 10; // maksimal kirim 10 stiker biar gak spam
    let counter = 0;

    for (let s of data.result) {
      if (!s.url) continue;
      await vinss.sendMessage(from, { sticker: { url: s.url } }, { quoted: m });
      counter++;
      if (counter >= limit) {
        await vinss.sendMessage(from, { text: `⚠️ Sticker terlalu banyak, hanya dikirim ${limit} pertama.` }, { quoted: m });
        break;
      }
    }

  } catch (e) {
    console.error("❌ Error telesticker:", e);
    m.reply("❌ Terjadi kesalahan saat mengambil sticker pack!");
  }
}
break;

case "pinterest":
if (!args[0]) return m.reply("⚠ Masukkan kata kunci!\nContoh: .pinterest kucing lucu");
try {
let res = await pinterest(args.join(" "));
if (!res.length) return m.reply("❌ Tidak ditemukan!");
let img = res[Math.floor(Math.random() * res.length)];
await vinss.sendMessage(from, { image: { url: img }, caption: `🔎 Hasil Pinterest: ${args.join(" ")}` }, { quoted: m });
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengambil gambar Pinterest!");
}
break;

case "wallpaper2": {
  if (!q) return m.reply("⚠ Masukkan kata kunci!\nContoh: .wallpaper2 anime");

  try {
    let res = await wallpaper(q);
    if (!res.length) return m.reply("❌ Tidak ditemukan!");
    let pick = res[Math.floor(Math.random() * res.length)];
    await vinss.sendMessage(from, { image: { url: pick.image[0] }, caption: `🖼 Wallpaper: ${pick.title}\n📌 ${pick.type}\n🔗 ${pick.source}` }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal ambil wallpaper!");
  }
}
break;


case "wikimedia2": {
  if (!q) return m.reply("⚠ Masukkan kata kunci!\nContoh: .wikimedia2 sunset");

  try {
    let res = await wikimedia(q);
    if (!res.length) return m.reply("❌ Tidak ditemukan!");
    let pick = res[Math.floor(Math.random() * res.length)];
    await vinss.sendMessage(from, { image: { url: pick.image }, caption: `📚 Wikimedia: ${pick.title}\n🔗 ${pick.source}` }, { quoted: m });
  } catch (e) {
    console.error(e);
    m.reply("❌ Gagal ambil dari Wikimedia!");
  }
}
break;

case "quotesanime":
try {
let res = await quotesAnime();
if (!res.length) return m.reply("❌ Tidak ditemukan!");
let pick = res[Math.floor(Math.random() * res.length)];
let caption = `🎌 *Quotes Anime*\n\n"${pick.quotes}"\n\n👤 ${pick.karakter} - ${pick.anime}`;
await vinss.sendMessage(from, { image: { url: pick.gambar }, caption }, { quoted: m });
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengambil quotes anime!");
}
break;

case "aiovideodl":
if (!args[0]) return m.reply("⚠ Masukkan URL video!\nContoh: .aiovideodl https://...");
try {
let res = await aiovideodl(args[0]);
if (!res || !res.medias) return m.reply("❌ Tidak dapat mengambil video!");
let vid = res.medias.find(v => v.extension === "mp4");
await vinss.sendMessage(from, { video: { url: vid.url }, caption: `✅ Video berhasil diunduh.` }, { quoted: m });
} catch (e) {
console.error(e);
m.reply("❌ Gagal mengunduh video!");
}
break;
// ================== RPG COMMANDS (group-only + auto levelup) ==================

case "profile": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let teks = `🎮 *RPG Profile* 🎮\n👤 User: @${senderNumber}\n💰 Uang: ${user.uang}\n⭐ Level: ${user.level}\n📊 Exp: ${user.exp}\n⚡ Stamina: ${user.stamina}\n🐟 Ikan: ${user.ikan}\n🍖 Daging: ${user.daging}\n🪨 Batu: ${user.batu}\n🪙 Emas: ${user.emas}\n🐾 Pet: ${user.pet ? user.pet.type+" Lv."+user.pet.level : "Tidak punya"}\n💍 Married To: ${user.marriedTo ? user.marriedTo : "-"}`;
await vinss.sendMessage(from, { text: teks, mentions: [sender] }, { quoted: m });
}
break;

case "work": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest untuk istirahat.");
let hasil = Math.floor(Math.random() * 200) + 50;
// pet bonus
if (user.pet) hasil = Math.floor(hasil * (1 + (user.pet.level * 0.05)));
user.uang += hasil;
user.stamina -= 2;
user.exp += 5;
m.reply(`💼 Kamu bekerja dan mendapatkan 💰 ${hasil}!\nStamina -2, Exp +5`);
checkLevelUp(user, m, vinss);
}
break;

case "fish": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest untuk istirahat.");
let dapat = Math.random() < 0.7;
if (dapat) {
let jumlah = Math.floor(Math.random() * 3) + 1;
if (user.pet && user.pet.type === 'ikan') jumlah += Math.floor(user.pet.level/2);
user.ikan += jumlah;
m.reply(`🎣 Kamu memancing dan dapat 🐟 ${jumlah} ikan!`);
} else {
m.reply("🎣 Kamu memancing tapi tidak dapat apa-apa...");
}
user.stamina -= 1;
user.exp += 3;
checkLevelUp(user, m, vinss);
}
break;

case "hunt": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest untuk istirahat.");
let dapat = Math.random() < 0.5;
if (dapat) {
let jumlah = Math.floor(Math.random() * 2) + 1;
if (user.pet && user.pet.type === 'anjing') jumlah += Math.floor(user.pet.level/2);
user.daging += jumlah;
m.reply(`🏹 Kamu berburu dan dapat 🍖 ${jumlah} daging!`);
} else {
m.reply("🏹 Kamu berburu tapi tidak dapat hasil...");
}
user.stamina -= 2;
user.exp += 5;
checkLevelUp(user, m, vinss);
}
break;

case "sell": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let jualIkan = (user.ikan || 0) * 100;
let jualDaging = (user.daging || 0) * 200;
let total = jualIkan + jualDaging;
if (total === 0) return m.reply("⚠️ Kamu tidak punya item untuk dijual!");
user.uang += total;
user.ikan = 0;
user.daging = 0;
m.reply(`💰 Kamu menjual semua item dan dapat ${total}!`);
}
break;

case "rest": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
user.stamina = 10 + user.level;
m.reply("😴 Kamu istirahat dan stamina kembali penuh!");
}
break;

case "mine": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest untuk istirahat.");
let hasil = Math.random();
if (hasil < 0.6) {
let jumlah = Math.floor(Math.random() * 3) + 1;
if (user.pet && user.pet.type === 'kambing') jumlah += Math.floor(user.pet.level/2);
user.batu += jumlah;
m.reply(`⛏️ Kamu menambang dan dapat 🪨 ${jumlah} batu!`);
} else {
let jumlah = Math.floor(Math.random() * 2) + 1;
user.emas += jumlah;
m.reply(`⛏️ Kamu menambang dan dapat 🪙 ${jumlah} emas!`);
}
user.stamina -= 2;
user.exp += 7;
checkLevelUp(user, m, vinss);
}
break;

case "inv": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let teks = `🎒 *Inventory @${senderNumber}*\n💰 Uang: ${user.uang}\n⭐ Level: ${user.level}\n📊 Exp: ${user.exp}\n⚡ Stamina: ${user.stamina}\n\n🐟 Ikan: ${user.ikan}\n🍖 Daging: ${user.daging}\n🪨 Batu: ${user.batu}\n🪙 Emas: ${user.emas}\n\n📦 Inventory: ${JSON.stringify(user.inventory)}`;
await vinss.sendMessage(from, { text: teks, mentions: [sender] }, { quoted: m });
}
break;

case "adventure": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest dulu.");
let chance = Math.random();
if (chance < 0.4) {
let uang = Math.floor(Math.random() * 300) + 100;
user.uang += uang;
m.reply(`🌍 Kamu berpetualang dan menemukan harta karun 💰 +${uang}`);
} else if (chance < 0.7) {
let exp = Math.floor(Math.random() * 30) + 10;
user.exp += exp;
m.reply(`🌍 Kamu berpetualang dan mendapat pengalaman ⭐ +${exp}`);
} else {
let lost = Math.floor(Math.random() * 100) + 50;
user.uang = Math.max(0, user.uang - lost);
m.reply(`💥 Kamu terjebak bandit! Kehilangan 💰 ${lost}`);
}
user.stamina -= 3;
checkLevelUp(user, m, vinss);
}
break;

case "daily": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let now = Date.now();
if (user.lastDaily && now - user.lastDaily < 86400000) {
let sisa = Math.ceil((86400000 - (now - user.lastDaily)) / 3600000);
return m.reply(`⚠️ Kamu sudah klaim daily! Tunggu ${sisa} jam lagi.`);
}
let hadiah = 500 + Math.floor(Math.random() * 500);
user.uang += hadiah;
user.lastDaily = now;
m.reply(`🎁 Kamu klaim hadiah harian: 💰 +${hadiah}`);
}
break;

case "gacha": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply("😴 Stamina habis! Ketik .rest dulu.");
let items = ["ikan", "daging", "emas", "batu"];
let item = items[Math.floor(Math.random() * items.length)];
let jumlah = Math.floor(Math.random() * 3) + 1;
user[item] += jumlah;
user.stamina -= 1;
user.exp += 4;
m.reply(`🎰 Kamu gacha dan dapat ${jumlah} ${item}!`);
checkLevelUp(user, m, vinss);
}
break;

case "casino": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let bet = parseInt(args[0]);
if (!bet || bet <= 0) return m.reply("⚠️ Masukkan jumlah taruhan!\nContoh: .casino 200");
if (user.uang < bet) return m.reply("❌ Uang kamu tidak cukup!");
let win = Math.random() < 0.5;
if (win) {
user.uang += bet;
m.reply(`🎲 Kamu menang! Uang +${bet}`);
} else {
user.uang -= bet;
m.reply(`🎲 Kamu kalah! Uang -${bet}`);
}
}
break;

case "heal": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.daging > 0) {
user.daging -= 1;
user.stamina += 5;
m.reply("🍖 Kamu makan daging, stamina +5");
} else if (user.ikan > 0) {
user.ikan -= 1;
user.stamina += 3;
m.reply("🐟 Kamu makan ikan, stamina +3");
} else {
m.reply("⚠️ Kamu tidak punya makanan untuk dimakan!");
}
}
break;

// =============== NEW FEATURES ===============

// Quest system
case "quest": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
// jika tidak ada quest aktif, generate baru
if (!user.quests || user.quests.length === 0) {
let types = [
{ id: 'work3', text: 'Kerja 3x', key: 'work', target: 3, reward: { uang: 300, exp: 30 } },
{ id: 'fish5', text: 'Dapatkan 5 ikan', key: 'ikan', target: 5, reward: { uang: 200, exp: 25 } },
{ id: 'mine2', text: 'Menambang 2x', key: 'mine', target: 2, reward: { uang: 250, exp: 30 } }
];
let q = types[Math.floor(Math.random()*types.length)];
q.progress = 0;
user.quests.push(q);
return m.reply(`📜 Quest baru: *${q.text}*\nUntuk menyelesaikan: lakukan aksi terkait. Reward: 💰${q.reward.uang} + ⭐${q.reward.exp}`);
} else {
// tampilkan quest
let teks = '📜 Quest Aktif:\n';
user.quests.forEach((q,i)=>{ teks += `${i+1}. ${q.text} (${q.progress}/${q.target})\n`; });
return m.reply(teks);
}
}
break;

// Dungeon / Boss
case "dungeon": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina < 5) return m.reply("⚠️ Butuh stamina minimal 5 untuk masuk dungeon!");
let bossHp = 50 + user.level * 10;
let damage = Math.floor(Math.random() * (60 + user.level*2)) + 20;
user.stamina -= 5;
if (damage >= bossHp) {
let reward = 300 + Math.floor(Math.random() * 200);
user.uang += reward;
user.exp += 30;
m.reply(`🐉 Kamu berhasil kalahkan boss dungeon!\n💰 +${reward} | ⭐ +30 exp`);
checkLevelUp(user, m, vinss);
} else {
let lost = 100 + Math.floor(Math.random()*user.level*10);
user.uang = Math.max(0, user.uang - lost);
user.stamina = Math.max(0, user.stamina - 2);
m.reply(`💀 Kamu kalah lawan boss... kehilangan 💰 ${lost}`);
}
}
break;

// Pet system
case "adopt": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.pet) return m.reply("⚠️ Kamu sudah punya pet!");
if (!args[0]) return m.reply("⚠️ Pilih jenis pet: anjing/kucing/ikan/kambing\nContoh: .adopt anjing");
let type = args[0].toLowerCase();
let types = ['anjing','kucing','ikan','kambing'];
if (!types.includes(type)) return m.reply("⚠️ Jenis pet tidak tersedia!");
user.pet = { type, level: 1 };
m.reply(`🐾 Kamu mengadopsi ${type}! Pet akan membantu aktivitas tertentu.`);
}
break;

case "pet": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (!user.pet) return m.reply('⚠️ Kamu belum punya pet. Gunakan .adopt <jenis>');
m.reply(`🐾 Pet kamu: ${user.pet.type} | Level: ${user.pet.level}`);
}
break;

case "upgradepet": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (!user.pet) return m.reply('⚠️ Kamu belum punya pet. Gunakan .adopt <jenis>');
let cost = user.pet.level * 500;
if (user.uang < cost) return m.reply(`⚠️ Butuh ${cost} untuk upgrade pet.`);
user.uang -= cost;
user.pet.level += 1;
m.reply(`✨ Pet kamu naik ke level ${user.pet.level}!`);
}
break;

// Crafting (simple)
case "craft": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (!args[0]) return m.reply("⚠️ Gunakan: .craft <item>\nContoh: .craft pedang\nReagen: 2 batu + 1 emas");
let item = args[0].toLowerCase();
if (item === 'pedang') {
if ((user.batu || 0) < 2 || (user.emas || 0) < 1) return m.reply('⚠️ Bahan tidak cukup. Butuh 2 batu + 1 emas');
user.batu -= 2; user.emas -= 1;
user.inventory['pedang'] = (user.inventory['pedang']||0) + 1;
m.reply('⚒️ Berhasil craft Pedang! Inventory pedang +1 (pedang memberi bonus exp saat battle)');
} else {
m.reply('⚠️ Item crafting tidak dikenal. Contoh yang tersedia: pedang');
}
}
break;

// Trade / gift
case "trade": {
if (!isGroup) return m.reply(global.mess.group);
if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid) return m.reply('⚠️ Tag user untuk trade!');
let target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
let amount = parseInt(args[1]);
if (!amount || amount <= 0) return m.reply('⚠️ Masukkan jumlah uang yang ingin dikirim.');
let user = initRPG(senderNumber);
let targetNum = target.split('@')[0];
let other = initRPG(targetNum);
if (user.uang < amount) return m.reply('❌ Uang kamu tidak cukup!');
user.uang -= amount;
other.uang += amount;
m.reply(`✅ Berhasil mengirim ${amount} ke @${targetNum}` , { mentions: [target] });
}
break;

// Leaderboard top
case "top": {
if (!isGroup) return m.reply(global.mess.group);
// get top by level then exp
let users = Object.entries(global.db.data.rpg)
.map(([id,u]) => ({ id, ...u }))
.sort((a,b) => b.level - a.level || b.exp - a.exp)
.slice(0,10);
let teks = "🏆 *Top 10 Player* 🏆\n\n";
let mentions = [];
for (let i=0;i<users.length;i++){
let uid = users[i].id;
teks += `${i+1}. @${uid} | Lv.${users[i].level} | 💰 ${users[i].uang}\n`;
mentions.push(uid + '@s.whatsapp.net');
}
await vinss.sendMessage(from, { text: teks, mentions }, { quoted: m });
}
break;

// Marry
case "marry": {
if (!isGroup) return m.reply(global.mess.group);
if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid) return m.reply('⚠️ Tag user untuk menikah!');
let target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
let targetNum = target.split('@')[0];
if (targetNum === senderNumber) return m.reply('⚠️ Kamu tidak bisa menikahi diri sendiri!');
let user = initRPG(senderNumber);
let other = initRPG(targetNum);
if (user.marriedTo || other.marriedTo) return m.reply('⚠️ Salah satu sudah menikah!');
user.marriedTo = targetNum;
other.marriedTo = senderNumber;
m.reply(`💍 Selamat! @${senderNumber} menikah dengan @${targetNum}`, { mentions: [target, sender] });
}
break;

case "divorce": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (!user.marriedTo) return m.reply('⚠️ Kamu tidak sedang menikah!');
let partner = initRPG(user.marriedTo);
partner.marriedTo = null;
user.marriedTo = null;
m.reply('💔 Kamu telah bercerai.');
}
break;

// Ojek mini-game: antar penumpang / dapat fare
case "ojek": {
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (user.stamina <= 0) return m.reply('😴 Stamina habis! Ketik .rest dulu.');
// random fare and distance
let distance = Math.floor(Math.random()*15)+1; // km
let fare = distance * (Math.floor(Math.random()*20)+10); // variable rate
// small pet bonus
if (user.pet && user.pet.type === 'kucing') fare = Math.floor(fare * 1.1);
user.uang += fare;
user.exp += Math.floor(distance/2) + 2;
user.stamina -= Math.ceil(distance/5);
m.reply(`🏍️ Ojek selesai! Jarak ${distance}km | Pendapatan 💰 ${fare} | Exp +${Math.floor(distance/2)+2}`);
checkLevelUp(user, m, vinss);
}
break;

case "ulartangga": {
  if (!isGroup) return vinss.sendMessage(from, { text: "⚠ Hanya bisa di grup!" });

  if (snakeLadder[from]) {
    return vinss.sendMessage(from, { text: "⚠ Game sudah berjalan di grup ini!" });
  }

  if (!m.message.extendedTextMessage?.contextInfo?.mentionedJid) {
    return vinss.sendMessage(from, { text: "⚠ Tag teman untuk mulai main!\nContoh: .ulartangga @user1 @user2" });
  }

  const players = [sender, ...m.message.extendedTextMessage.contextInfo.mentionedJid];
  snakeLadder[from] = {
    players,
    positions: Object.fromEntries(players.map((p) => [p, 0])),
    turn: 0,
  };

  vinss.sendMessage(from, {
    text: `🎮 Game Ular Tangga dimulai!\n\nPemain:\n${players.map((p, i) => `P${i + 1}: @${p.split("@")[0]}`).join("\n")}\n\nGiliran pertama: @${players[0].split("@")[0]} (ketik .roll)`,
    mentions: players,
  });
}
break;

case "roll": {
  if (!isGroup) return vinss.sendMessage(from, { text: "⚠ Hanya bisa dimainkan di grup!" });
  if (!snakeLadder[from]) {
    return vinss.sendMessage(from, { text: "⚠ Tidak ada game di grup ini!\nKetik .ulartangga untuk mulai." });
  }

  let game = snakeLadder[from];
  let currentPlayer = game.players[game.turn];

  if (!game.players.includes(sender)) return; // abaikan selain pemain
  if (sender !== currentPlayer) {
    return vinss.sendMessage(from, {
      text: `⚠ Sekarang giliran @${currentPlayer.split("@")[0]}`,
      mentions: [currentPlayer],
    });
  }

  let dice = Math.floor(Math.random() * 6) + 1;
  game.positions[sender] += dice;

  // Ular & tangga
  const ladders = { 3: 22, 5: 8, 11: 26, 20: 29 };
  const snakes = { 27: 1, 21: 9, 17: 4, 19: 7 };
  if (game.positions[sender] in ladders) game.positions[sender] = ladders[game.positions[sender]];
  if (game.positions[sender] in snakes) game.positions[sender] = snakes[game.positions[sender]];

  // Render papan
  const buffer = await drawBoard(game);

  await vinss.sendMessage(
    from,
    {
      image: buffer,
      caption: `🎲 @${sender.split("@")[0]} lempar dadu: *${dice}*\n📍 Posisi sekarang: ${game.positions[sender]}`,
      mentions: [sender],
    },
    { quoted: m }
  );

  if (game.positions[sender] >= 100) {
    vinss.sendMessage(from, {
      text: `🏆 @${sender.split("@")[0]} MENANG!!! 🎉`,
      mentions: [sender],
    });
    delete snakeLadder[from];
  } else {
    game.turn = (game.turn + 1) % game.players.length;
    let nextPlayer = game.players[game.turn];
    vinss.sendMessage(from, {
      text: `➡ Giliran selanjutnya: @${nextPlayer.split("@")[0]}`,
      mentions: [nextPlayer],
    });
  }
}
break;



default:
return m.reply(global.mess.error);
}
} catch (err) {
console.error("❌ Error di vinss.js:", err);
}
};

// ==============================
// ♻ Auto Reload Handler
// ==============================
let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(chalk.yellowBright(`♻ Update ${__filename}`));
delete require.cache[file];
require(file);
});
