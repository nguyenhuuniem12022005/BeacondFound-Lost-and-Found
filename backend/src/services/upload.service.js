/**
 * Upload Service
 * - Nếu có CLOUDINARY_* trong .env: upload thẳng lên Cloudinary.
 * - Nếu không: mock bằng cách lưu file vào thư mục uploads/ và trả URL local.
 * Khi có API key thật chỉ cần điền .env, không cần sửa code.
 */
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

function hasCloudinaryConfig() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(file) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'beacondfound' }, (err, res) =>
        err ? reject(err) : resolve(res)
      )
      .end(file.buffer);
  });
  return result.secure_url;
}

async function uploadToLocal(file, baseUrl) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return `${baseUrl}/uploads/${filename}`;
}

/**
 * @param {Express.Multer.File[]} files
 * @param {string} baseUrl ví dụ http://localhost:5000
 * @returns {Promise<string[]>} danh sách URL ảnh
 */
async function uploadImages(files, baseUrl) {
  const urls = [];
  for (const file of files) {
    if (hasCloudinaryConfig()) {
      urls.push(await uploadToCloudinary(file));
    } else {
      urls.push(await uploadToLocal(file, baseUrl));
    }
  }
  return urls;
}

module.exports = { uploadImages, UPLOAD_DIR };
