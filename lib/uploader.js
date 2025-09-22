const axios = require('axios');
const BodyForm = require('form-data');
const fs = require('fs');

// Upload ke Telegraph
async function TelegraPh(path) {
  if (!fs.existsSync(path)) throw new Error('File tidak ditemukan');
  const form = new BodyForm();
  form.append('file', fs.createReadStream(path));
  const { data } = await axios.post('https://telegra.ph/upload', form, {
    headers: form.getHeaders(),
  });
  return 'https://telegra.ph' + data[0].src;
}

// Upload ke Uguu
async function UploadFileUgu(path) {
  if (!fs.existsSync(path)) throw new Error('File tidak ditemukan');
  const form = new BodyForm();
  form.append('files[]', fs.createReadStream(path));
  const { data } = await axios.post('https://uguu.se/upload.php', form, {
    headers: form.getHeaders(),
  });
  return data.files?.[0]?.url || data.files?.[0];
}

// Fallback handleToUrl
async function handleToUrl(path) {
  try {
    const url = await TelegraPh(path);
    return { success: true, service: 'Telegraph', url };
  } catch (err) {
    console.warn('Telegraph gagal, fallback ke Uguu:', err.message);
    try {
      const url = await UploadFileUgu(path);
      return { success: true, service: 'Uguu', url };
    } catch (e2) {
      return { success: false, error: e2.message };
    }
  }
}

// ⚠️ Ekspor semua fungsi di sini
module.exports = { TelegraPh, UploadFileUgu, handleToUrl };
