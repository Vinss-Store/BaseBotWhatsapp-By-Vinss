<div align="center">

![BASEBOT-WA-VINSS](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=BASEBOT-WA-VINSS&fontSize=50&fontAlignY=35&animation=twinkling&fontColor=ffffff)

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://javascript.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com)
[![GitHub Stars](https://img.shields.io/github/stars/Vinss-Store/BaseBotWhatsapp-By-Vinss?style=for-the-badge&logo=github)](https://github.com/Vinss-Store/BaseBotWhatsapp-By-Vinss/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Vinss-Store/BaseBotWhatsapp-By-Vinss?style=for-the-badge&logo=github)](https://github.com/Vinss-Store/BaseBotWhatsapp-By-Vinss/network)

<h3>🤖 Bot WhatsApp Multi-Fitur ⚡ Berbasis Node.js & Baileys 🚀</h3>

<p align="center">
  <em>Bot WhatsApp terlengkap dengan fitur grup management, RPG game, downloader, dan tools lainnya. Cocok untuk kebutuhan personal maupun grup!</em>
</p>

</div>

---

## 🌟 **Fitur Unggulan**

<table>
<tr>
<td width="50%">

### 👥 **Group Management**
- 🚫 **Anti Link** - Auto kick spammer link
- 🛡️ **Anti Spam** - Perlindungan dari spam
- 👋 **Welcome/Goodbye** - Salam otomatis member
- 👑 **Auto Promote** - Promote bot jadi admin
- ⚙️ **Full Control** - Kick, add, promote, demote, dll

### 🎮 **RPG Game System**
- 👤 **Profile & Leveling** - Sistem level user
- 💼 **Work & Economy** - Kerja dan ekonomi
- 🎣 **Mini Games** - Fish, Hunt, Mine, Casino
- 🎒 **Inventory** - Sistem item dan gacha
- 🏆 **Quest & Daily** - Misi harian dan quest

</td>
<td width="50%">

### 🛠️ **Advanced Tools**
- 🔗 **Shortlink** - Buat URL pendek
- 🌐 **Translate** - Terjemah multi-bahasa  
- 🖼️ **Remove BG** - Hapus background foto
- ☁️ **Image Upload** - Upload ke hosting
- 📷 **Screenshot** - SS website otomatis

### 📥 **Media Downloader**
- 📌 **Pinterest** - Download gambar Pinterest
- 🎵 **TikTok** - Download video TikTok
- 📸 **Instagram** - Download konten IG
- 🎬 **Multi Platform** - Support banyak situs

</td>
</tr>
</table>

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js v16+ 
- NPM/Yarn
- Git

### **Installation**

```bash
# 📥 Clone repository
git clone https://github.com/Vinss-Store/BaseBotWhatsapp-By-Vinss.git

# 📁 Masuk ke direktori
cd BaseBotWhatsapp-By-Vinss

# 📦 Install dependencies
npm install

# ⚙️ Konfigurasi bot
cp config.js.example config.js
# Edit config.js sesuai kebutuhan

# 🚀 Jalankan bot
npm start
```

<div align="center">

### **🎉 Bot siap digunakan!**
*Scan QR code yang muncul di terminal dengan WhatsApp Anda*

</div>

---

## ⚙️ **Konfigurasi**

<details>
<summary><b>🔧 Config.js Settings</b></summary>

```javascript
// Owner Configuration
global.owner = ['6281234567890']  // Nomor owner
global.ownername = 'VinssStore'   // Nama owner

// Bot Configuration  
global.botname = 'BaseBot-WA'     // Nama bot
global.prefix = '.'               // Prefix command

// API Keys (Opsional)
global.zenzkey = 'your_api_key'   // Zenz API
global.bingkey = 'your_api_key'   // Bing API

// Welcome Message
global.welcome = true             // Enable welcome
global.goodbye = true             // Enable goodbye
```

</details>

<details>
<summary><b>📋 Daftar Command Lengkap</b></summary>

### **👑 Owner Commands**
| Command | Deskripsi |
|---------|-----------|
| `.addowner` | Tambah owner baru |
| `.delowner` | Hapus owner |
| `.broadcast` | Kirim pesan ke semua chat |
| `.restart` | Restart bot |
| `.shutdown` | Matikan bot |

### **👥 Group Commands**  
| Command | Deskripsi |
|---------|-----------|
| `.kick @user` | Kick member |
| `.add 628xxx` | Add member |
| `.promote @user` | Jadikan admin |
| `.demote @user` | Turunkan admin |
| `.tagall` | Tag semua member |

### **🎮 RPG Commands**
| Command | Deskripsi |
|---------|-----------|
| `.profile` | Lihat profil |
| `.work` | Bekerja cari uang |
| `.fish` | Memancing |
| `.hunt` | Berburu |
| `.daily` | Hadiah harian |

### **🛠️ Tools Commands**
| Command | Deskripsi |
|---------|-----------|
| `.sticker` | Buat sticker |
| `.translate` | Translate teks |
| `.removebg` | Hapus background |
| `.shortlink` | Buat short URL |

</details>

---

## 📁 **Struktur Project**

```
📦 BaseBotWhatsapp-By-Vinss
├── 📄 index.js           # Entry point
├── 📄 vinss.js           # Core bot logic  
├── 📄 config.js          # Konfigurasi
├── 📁 lib/               # Libraries
│   ├── scraper.js        # Web scraper
│   └── uploader.js       # File uploader
├── 📁 database/          # Database files
│   ├── user.json         # Data user
│   └── group.json        # Data grup
├── 📁 vinssCreds/        # Session data
└── 📁 media/             # Media files
```

---

## 🤝 **Contributing**

<div align="center">

**Kontribusi sangat diterima!** 🙏

[![Contributors](https://contrib.rocks/image?repo=Vinss-Store/BaseBotWhatsapp-By-Vinss)](https://github.com/Vinss-Store/BaseBotWhatsapp-By-Vinss/graphs/contributors)

</div>

### **Cara Berkontribusi:**
1. 🍴 Fork repository ini
2. 🌿 Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit perubahan (`git commit -m 'Add AmazingFeature'`)
4. 📤 Push ke branch (`git push origin feature/AmazingFeature`)
5. 🔃 Buat Pull Request

---

## 📞 **Support & Contact**

<div align="center">

### **🔗 Find Me On:**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Vinss-Store)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/6281234567890)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/vinssstore)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/vinss.store)

### **💝 Support Development**

[![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/vinssstore)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/vinssstore)

</div>

---

## 📄 **License**

<div align="center">

**MIT License** © 2024 VinssStore

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*Dibuat dengan ❤️ oleh [VinssStore](https://github.com/Vinss-Store)*

</div>

---

<div align="center">

**⭐ Jangan lupa kasih star jika project ini membantu! ⭐**

![Visitor Badge](https://visitor-badge.laobi.icu/badge?page_id=Vinss-Store.BaseBotWhatsapp-By-Vinss)

</div>
