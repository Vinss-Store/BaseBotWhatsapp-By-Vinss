const { downloadMediaMessage, jidDecode } = require("@whiskeysockets/baileys");
const {
pinterest,
wallpaper,
wikimedia,
quotesAnime,
tiktokDl,
instagramDl,
ringtone,
styletext
} = require('./lib/scraper');
const fs = require("fs");
const chalk = require("chalk");
const fetch = require("node-fetch"); // untuk clonepp
const path = require('path');
const { TelegraPh, handleToUrl } = require('./lib/uploader');
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const dbPath = path.join(__dirname, 'database', 'registeredUsers.json');

global.registeredUsers = global.registeredUsers || [];
global.registeredUsers = loadRegisteredUsers();
const snakeLadder = {};

function loadRegisteredUsers() {
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading registered users:', error);
    }
    return {};
}

function saveRegisteredUsers() {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(global.registeredUsers, null, 2));
    } catch (error) {
        console.error('Error saving registered users:', error);
    }
}

function registerUser(userId, name = '', age = 0) {
    if (!global.db.data.users) global.db.data.users = {};
    
    if (!global.registeredUsers[userId]) {
        // Simpan ke memory
        global.registeredUsers[userId] = {
            registered: true,
            regDate: Date.now(),
            name: name,
            age: age
        };
        
        // Simpan ke file database
        saveRegisteredUsers();
        
        // Buat data user di sistem RPG
        if (!global.db.data.users[userId]) {
            global.db.data.users[userId] = {
                registered: true,
                regDate: Date.now(),
                name: name,
                age: age,
                uang: 1000,
                exp: 0,
                level: 1,
                stamina: 10,
                ikan: 0,
                daging: 0,
                emas: 0,
                batu: 0,
                lastDaily: 0,
                quests: [],
                pet: null,
                marriedTo: null,
                inventory: {},
            };
        } else {
            // Update data existing
            global.db.data.users[userId].registered = true;
            global.db.data.users[userId].regDate = Date.now();
            global.db.data.users[userId].name = name;
            global.db.data.users[userId].age = age;
        }
        return true;
    }
    return false;
}

function isRegistered(user) {
    // Cek di memory (yang sudah diload dari file)
    if (global.registeredUsers[user]) {
        return true;
    }
    
    // Auto migrate dari sistem lama (jika ada)
    if (global.db.data.rpg && global.db.data.rpg[user]) {
        if (!global.db.data.users) global.db.data.users = {};
        if (!global.db.data.users[user]) {
            global.db.data.users[user] = {
                registered: true,
                regDate: Date.now(),
                name: `User${user}`,
                age: 18,
                ...global.db.data.rpg[user]
            };
            console.log(`✅ Auto-migrated user: ${user}`);
        }
        
        // Simpan ke sistem registrasi baru
        global.registeredUsers[user] = {
            registered: true,
            regDate: Date.now(),
            name: `User${user}`,
            age: 18
        };
        saveRegisteredUsers();
        
        return true;
    }
    
    return false;
}

function initUser(user) {
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[user]) {
        global.db.data.users[user] = {
            registered: false,
            regDate: 0,
            name: '',
            age: 0,
            uang: 0,
            exp: 0,
            level: 1,
            stamina: 10,
            ikan: 0,
            daging: 0,
            emas: 0,
            batu: 0,
            lastDaily: 0,
            quests: [],
            pet: null,
            marriedTo: null,
            inventory: {},
        };
    }
    return global.db.data.users[user];
}

function getQuotedImage(m) {
if (m.message?.imageMessage) return m; // kirim gambar langsung
if (m.quoted && m.quoted.message?.imageMessage) return m.quoted; // reply gambar
if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage)
return { message: m.message.extendedTextMessage.contextInfo.quotedMessage };
return null;
}

// ==============================
// Helper Function
// ==============================
function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)];
}



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
quests: [],
pet: null,
marriedTo: null,
inventory: {},
};
}
return global.db.data.rpg[user];
}


function checkLevelUp(user, m, vinss) {
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

const text = body || "";
const budy = typeof body === "string" ? body.trim() : "";

const prefix = global.prefix;
let command = null;
let args = [];
if (budy.startsWith(prefix)) {
const sliced = budy.slice(prefix.length).trim().split(/ +/);
command = sliced.shift().toLowerCase();
args = sliced;
}
const q = args.join(" "); 

const from = m.key.remoteJid;
const botNumber = vinss.decodeJid(vinss.user.id);
const isGroup = from.endsWith("@g.us");

const sender = m.key.fromMe
? botNumber
: isGroup
? vinss.decodeJid(m.key.participant || m.participant)
: vinss.decodeJid(m.key.remoteJid);

const rawNumber = sender.split("@")[0];
const senderNumber = rawNumber.startsWith("62")
? rawNumber
: rawNumber.replace(/\D/g, "");

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

const botInGroup = isGroup ? groupMetadata.participants.find(p => p.id === botNumber) : null;
const isBotAdmin = isGroup ? !!botInGroup?.admin : false;

if (!global.db.groups) global.db.groups = {};
if (!global.db.groups[from]) global.db.groups[from] = { antilink: false };

let set = global.db.groups[from];


// ================== PROTEKSI LINK ==================
if (global.antilink && text) {
          const isLink = text.match(/(https?:\/\/[^\s]+)/gi);
          if (isLink && !isAdmins && !isGroupOwner) {
            // try delete message
            try {
              await vinss.sendMessage(from, {
                delete: {
                  remoteJid: from,
                  fromMe: false,
                  id: m.key.id,
                  participant: m.key.participant,
                },
              });
            } catch {}
            await vinss.sendMessage(
              from,
              {
                text: `🚫 *Link terdeteksi!* Pesan dari @${senderNumber} sudah dihapus.`,
                mentions: [sender],
              },
              { quoted: m }
            );
          }
        }


if (!command) return;
// =============================
// 🔧 Command Handler
// =============================
switch (command) {

case "menu": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
const reactions = ['👍', '❤️', '🔥', '🎮', '🤖'];
for (let i = 0; i < reactions.length; i++) {
setTimeout(async () => {
await vinss.sendMessage(from, {
react: {
text: reactions[i],
key: m.key
}
});
}, i * 1000);
}

setTimeout(async () => {
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
│ • ${prefix}sysinfo
│ • ${prefix}leave
│ • ${prefix}leaveall
│ • ${prefix}ssweb <url>
│ • ${prefix}readqr (reply gambar QR)
│ • ${prefix}block @tag
│ • ${prefix}unblock @tag
│ • ${prefix}clearall
│ • ${prefix}uptime
│ • ${prefix}join <linkgc>
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
│ • ${prefix}groupinfo
│ • ${prefix}lockgroup / ${prefix}unlockgroup
╰❒

╭─❒ *TOOLS / MAKER*
│ • ${prefix}shortlink <url>
│ • ${prefix}translate <lang> <teks>
│ • ${prefix}tourl (reply foto)
│ • ${prefix}ssweb <url>
│ • ${prefix}styletext <teks>
│ • ${prefix}ringtone <judul>
│ • ${prefix}brat <teks>
│ • ${prefix}iqc <teks>
╰❒

╭─❒ *DOWNLOADER / MEDIA*
│ • ${prefix}tiktok <url>
│ • ${prefix}instagram <url>
│ • ${prefix}telesticker <url>
│ • ${prefix}pinterest <query>
│ • ${prefix}wallpaper <query>
│ • ${prefix}wallpaper2 <query>
│ • ${prefix}wikimedia <query>
│ • ${prefix}wikimedia2 <query>
│ • ${prefix}quotesanime
│ • ${prefix}stalkig <username>
╰❒

╭─❒ *RPG & GAME (Group Only)*
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
│ • ${prefix}roll
╰❒

ℹ️ Gunakan prefix: *${prefix}* sebelum command.
`;
const thumbnailBuffer = fs.readFileSync("./media/thumbnail.png");
await vinss.sendMessage(
from,
{
document: thumbnailBuffer,
fileName: `${global.ucapanWaktu} - ${global.botName} Command List.pdf`,
mimetype: "application/pdf",
jpegThumbnail: thumbnailBuffer,
fileLength: '100000000000000',
pageCount: '999',
caption: menuText,
mentions: [sender],
contextInfo: {
mentionedJid: [sender, '0@s.whatsapp.net', global.ownerNumber[0] + '@s.whatsapp.net'],
externalAdReply: {
title: global.author,
body: global.packname,
thumbnailUrl: global.profile,
mediaType: 1,
mediaUrl: global.my.gh,
}
}
},
{ quoted: m }
);
}, 5000); 
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

case "register": {
    // Cek apakah sudah terdaftar di sistem persist
    if (isRegistered(senderNumber)) {
        let userData = global.registeredUsers[senderNumber] || initUser(senderNumber);
        return m.reply(`✅ Kamu sudah terdaftar!\n\n👤 Nama: ${userData.name}\n🎂 Umur: ${userData.age}\n📅 Bergabung: ${new Date(userData.regDate).toLocaleDateString()}`);
    }

    let name = args[0];
    let age = parseInt(args[1]);

    if (!name || !age || age < 5 || age > 100) {
        return m.reply(`⚠️ *FORMAT REGISTRASI*\n\nGunakan: *${prefix}register <nama> <umur>*\n\nContoh: *${prefix}register Vinss 18*\n\n❌ Umur harus antara 5-100 tahun!`);
    }

    if (registerUser(senderNumber, name, age)) {
        m.reply(`🎉 *REGISTRASI BERHASIL!*\n\n👤 Nama: ${name}\n🎂 Umur: ${age}\n💰 Bonus: 1000 uang\n📅 Tanggal: ${new Date().toLocaleDateString()}\n\n🎮 Sekarang kamu bisa menggunakan semua fitur bot!\nKetik *${prefix}menu* untuk melihat daftar fitur.`);
    } else {
        m.reply("❌ Gagal registrasi! Silahkan coba lagi.");
    }
}
break;
case "unregister": {
if (!isOwner) return m.reply(global.mess.owner);

let target = args[0] || senderNumber;
if (target.includes('@')) target = target.split('@')[0];

if (global.db.data.users && global.db.data.users[target]) {
global.db.data.users[target].registered = false;
m.reply(`✅ User ${target} berhasil diunregister!`);
} else {
m.reply("❌ User tidak ditemukan di database!");
}
}
break;

case "migrateusers": {
if (!isOwner) return m.reply(global.mess.owner);

let migrated = 0;
if (global.db.data.rpg) {
for (let userId in global.db.data.rpg) {
if (!isRegistered(userId)) {
registerUser(userId, `User${userId}`, 18);
migrated++;
}
}
}
m.reply(`✅ Berhasil migrate ${migrated} pengguna lama ke sistem registrasi baru!`);
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
document: { url: './database/database.json' },
mimetype: 'application/json',
fileName: 'database.json',
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
document: { url: './vinssCreds/creds.json' },
mimetype: 'application/json',
fileName: 'session.json',
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
//================= ISLAMIC MENU =================//
// =========================
// FITUR DOA HARIAN
// =========================
case 'doaharian': {
try {
await vinss.sendMessage(from, { text: global.mess.wait }, { quoted: m });

const base = global.APIs.botcahx;
const key = global.APIKeys[base];
const url = `${base}/api/muslim/doaharian?apikey=${key}`;
const { data } = await axios.get(url);

// Debugging isi respons
// console.log(JSON.stringify(data, null, 2));

if (!data || !data.result || !Array.isArray(data.result.data)) {
return vinss.sendMessage(from, { text: "❌ Data doa tidak ditemukan!" }, { quoted: m });
}

const doaList = data.result.data;
const doa = doaList[Math.floor(Math.random() * doaList.length)];

let teks = `
📿 *Doa Harian* 📿
────────────────────
📖 Judul: ${doa.title || "-"}
🕌 Arab: ${doa.arabic || "-"}
📝 Latin: ${doa.latin || "-"}
💬 Arti: ${doa.translation || "-"}
`.trim();

await vinss.sendMessage(from, { text: teks }, { quoted: m });

} catch (e) {
console.error("❌ Error doaharian:", e);
await vinss.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil doa harian!" }, { quoted: m });
}
break;
}

//================= MAKER MENU =================//
case "iqc": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let teksTag = `📢 *Tag All* oleh Admin\n\n`;
for (let mem of groupMetadata.participants) {
teksTag += `@${mem.id.split("@")[0]}\n`;
}
await vinss.sendMessage(from, { text: teksTag, mentions: groupMetadata.participants.map(p => p.id) }, { quoted: m });
break;

case "hidetag":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let htText = budy.slice(command.length + 1);
if (!htText) return m.reply("⚠ Masukkan teks untuk hidetag!");
await vinss.sendMessage(from, { text: htText, mentions: groupMetadata.participants.map(p => p.id) }, { quoted: m });
break;

case "setname":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
let newGcName = budy.slice(command.length + 1);
if (!newGcName) return m.reply("⚠ Masukkan nama grup baru!");
await vinss.groupUpdateSubject(from, newGcName);
m.reply(`✅ Nama grup berhasil diubah menjadi *${newGcName}*`);
break;

case "setdesc":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let newDesc = budy.slice(command.length + 1);
if (!newDesc) return m.reply("⚠ Masukkan deskripsi baru!");
await vinss.groupUpdateDescription(from, newDesc);
m.reply("✅ Deskripsi grup berhasil diubah!");
break;

case "setppgc":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.owner);
let inviteCode = await vinss.groupInviteCode(from);
m.reply(`🔗 *Link Group:*\nhttps://chat.whatsapp.com/${inviteCode}`);
break;

case "revoke":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
if (!(isOwner || isGroupOwner)) return m.reply(global.mess.owner);
await vinss.groupRevokeInvite(from);
m.reply("✅ Link grup berhasil direset!");
break;

case "antilink":
    if (!isGroup) return m.reply(global.mess.group);
    if (!(isOwner || isGroupOwner || isAdmins)) return m.reply(global.mess.admin);

    if (args[0] === "on") {
        global.antilink = true;
        vinss.sendMessage(from, { text: "✅ Antilink berhasil diaktifkan!" }, { quoted: m });
    } else if (args[0] === "off") {
        global.antilink = false;
        vinss.sendMessage(from, { text: "❌ Antilink berhasil dimatikan!" }, { quoted: m });
    } else {
        vinss.sendMessage(from, { text: `ℹ Gunakan: ${prefix}antilink on / off` }, { quoted: m });
    }
    break;


case "listadmin":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
let listAdmin = groupAdmins.map((id, i) => `${i + 1}. @${id.split("@")[0]}`).join("\n");
m.reply(`👑 *Daftar Admin Grup:*\n\n${listAdmin}`, { mentions: groupAdmins });
break;

// Only Admin (hanya admin bisa kirim pesan)
case "onlyadmin":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa aktifkan!");
await vinss.groupSettingUpdate(from, "announcement");
m.reply("✅ Sekarang hanya admin yang bisa kirim pesan di grup!");
break;

// Open Group (buka chat untuk semua)
case "opengroup":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa buka!");
await vinss.groupSettingUpdate(from, "not_announcement");
m.reply("✅ Grup sudah dibuka, semua member bisa chat!");
break;

// Mute Bot (bot ignore semua pesan di grup)
case "mute":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa mute!");
global.db.data.chats[from].mute = true;
m.reply("🤐 Bot dimute di grup ini!");
break;

case "unmute":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa unmute!");
global.db.data.chats[from].mute = false;
m.reply("✅ Bot sudah aktif kembali di grup ini!");
break;

// Welcome ON/OFF
case "welcome":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa set welcome!");
global.db.data.chats[from].welcome = !global.db.data.chats[from].welcome;
m.reply(`✅ Welcome message sekarang: *${global.db.data.chats[from].welcome ? "AKTIF" : "NONAKTIF"}*`);
break;

// Auto Kick Member yang SPAM (rare)
case "antispam":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa aktifkan!");
global.db.data.chats[from].antispam = !global.db.data.chats[from].antispam;
m.reply(`✅ Anti-Spam sekarang: *${global.db.data.chats[from].antispam ? "AKTIF" : "NONAKTIF"}*`);
break;

// Group Info Lengkap
case "groupinfo":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa lock!");
await vinss.groupSettingUpdate(from, "locked");
m.reply("🔒 Grup berhasil dikunci (tidak bisa tambah/hapus member).");
break;

case "unlockgroup":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply("⚠ Command ini hanya untuk grup!");
if (!isAdmins && !isOwner) return m.reply("⚠ Hanya admin/owner yang bisa unlock!");
await vinss.groupSettingUpdate(from, "unlocked");
m.reply("🔓 Grup berhasil dibuka kembali.");
break;

//================= TOLS MENU =================//
case "styletext": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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

case "ringtone": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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


case "ssweb":
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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



//================= DOWNLOADER ==================//
case "tiktok": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
let limit = 10;
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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

// ================== STALK IG ================== //
// ================== STALK IG ================== //
case "stalkig": {
try {
if (!q) return m.reply(`⚠️ Masukkan username IG!\nContoh: ${global.prefix}stalkig erlanrahmat_14`);

await vinss.sendMessage(from, { text: global.mess.wait }, { quoted: m });

// ambil base & key dari config
const base = global.APIs.botcahx; // misal "https://api.botcahx.eu.org/"
const key = global.APIKeys[base]; // misal "7g7LtR2M"

if (!base || !key) {
return await vinss.sendMessage(from, { text: "❌ Konfigurasi API tidak ditemukan. Cek global.js" }, { quoted: m });
}

const username = q.trim().split(/\s+/)[0];
const url = `${base.replace(/\/$/,'')}/api/stalk/ig?username=${encodeURIComponent(username)}&apikey=${encodeURIComponent(key)}`;

const res = await axios.get(url, { timeout: 15000 });
const data = res.data;

// Debug: console.log(JSON.stringify(data, null, 2));

// cek variasi struktur respons
// contoh respons yang kamu kirim:
// { status: true, code: 200, creator: "BOTCAHX", result: { username, fullName, bio, followers, following, postsCount, photoUrl } }
if (!data || (data.status === false) || !data.result) {
return await vinss.sendMessage(from, { text: "❌ Gagal mengambil data Instagram!" }, { quoted: m });
}

const ig = data.result || data; // fallback
// normalisasi nama field (kadang berbeda)
const usernameResp = ig.username || ig.user || "-";
const fullname = ig.fullName || ig.fullname || ig.name || "-";
const bio = ig.bio || ig.description || "-";
const followers = ig.followers ?? ig.followers_count ?? "-";
const following = ig.following ?? ig.following_count ?? "-";
const posts = ig.postsCount ?? ig.posts_count ?? ig.posts ?? "-";
const profilePic = ig.photoUrl || ig.profile || ig.profile_pic_url || ig.photo || null;

const teks = `
📸 *Instagram Stalker*
────────────────────
👤 Username : ${usernameResp}
🆔 Nama : ${fullname}
👥 Followers: ${followers}
👤 Following: ${following}
📌 Postingan: ${posts}
🔗 Bio: ${bio.length > 700 ? bio.slice(0,700) + '...' : bio}
`.trim();

// kirim dengan foto profil kalau ada, kalau tidak kirim teks saja
if (profilePic) {
await vinss.sendMessage(
from,
{
image: { url: profilePic },
caption: teks
},
{ quoted: m }
);
} else {
await vinss.sendMessage(from, { text: teks }, { quoted: m });
}
} catch (err) {
console.error("❌ Error stalkig:", err?.response?.data || err.message || err);
// kirim pesan error ke user
await vinss.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil data Instagram!" }, { quoted: m });
}
}
break;

// ================== RPG COMMANDS (group-only + auto levelup) ==================
case "myprofile":
case "profil": {
    if (!isRegistered(senderNumber)) {
        return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
    }
    
    let regData = global.registeredUsers[senderNumber];
    let userData = initUser(senderNumber);
    
    let teks = `👤 *PROFILE USER*\n\n` +
        `📛 Nama: ${regData.name}\n` +
        `🎂 Umur: ${regData.age}\n` +
        `📅 Bergabung: ${new Date(regData.regDate).toLocaleDateString()}\n` +
        `💰 Uang: ${userData.uang}\n` +
        `⭐ Level: ${userData.level}\n` +
        `📊 Exp: ${userData.exp}\n` +
        `⚡ Stamina: ${userData.stamina}\n` +
        `🐟 Ikan: ${userData.ikan}\n` +
        `🍖 Daging: ${userData.daging}\n` +
        `🪙 Emas: ${userData.emas}\n` +
        `🪨 Batu: ${userData.batu}\n` +
        `💍 Married: ${userData.marriedTo ? 'Yes' : 'No'}\n` +
        `🐾 Pet: ${userData.pet ? userData.pet.type + ' Lv.' + userData.pet.level : 'Tidak ada'}`;

    await vinss.sendMessage(from, { text: teks, mentions: [sender] }, { quoted: m });
}
break;

case "work": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
user.stamina = 10 + user.level;
m.reply("😴 Kamu istirahat dan stamina kembali penuh!");
}
break;

case "mine": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
let teks = `🎒 *Inventory @${senderNumber}*\n💰 Uang: ${user.uang}\n⭐ Level: ${user.level}\n📊 Exp: ${user.exp}\n⚡ Stamina: ${user.stamina}\n\n🐟 Ikan: ${user.ikan}\n🍖 Daging: ${user.daging}\n🪨 Batu: ${user.batu}\n🪙 Emas: ${user.emas}\n\n📦 Inventory: ${JSON.stringify(user.inventory)}`;
await vinss.sendMessage(from, { text: teks, mentions: [sender] }, { quoted: m });
}
break;

case "adventure": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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

case "quest": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
if (!isGroup) return m.reply(global.mess.group);
let user = initRPG(senderNumber);
if (!user.pet) return m.reply('⚠️ Kamu belum punya pet. Gunakan .adopt <jenis>');
m.reply(`🐾 Pet kamu: ${user.pet.type} | Level: ${user.pet.level}`);
}
break;

case "upgradepet": {
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
if (!isRegistered(senderNumber)) {
return m.reply(`⚠️ Kamu belum terdaftar!\nKetik ${prefix}register <nama> <umur> untuk mendaftar.`);
}
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
