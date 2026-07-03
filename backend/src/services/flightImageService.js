const fs = require("fs");
const path = require("path");

const uploadRoot = path.join(__dirname, "..", "..", "uploads", "flights");

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const publicUrl = (req, filePath) => {
  const relative = path.relative(path.join(__dirname, "..", ".."), filePath).replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${relative}`;
};

const saveImage = (req, file, folder) => {
  if (!file?.data || !file?.name) return "";
  if (!String(file.type || "").startsWith("image/")) throw new Error(`${file.name} is not a valid image`);

  const extension = path.extname(file.name) || `.${String(file.type).split("/")[1] || "jpg"}`;
  const safeBase = path.basename(file.name, extension).replace(/[^a-z0-9_-]/gi, "-").slice(0, 48) || "flight";
  const directory = path.join(uploadRoot, folder);
  fs.mkdirSync(directory, { recursive: true });
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${safeBase}${extension}`;
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, Buffer.from(String(file.data).split(",").pop(), "base64"));
  return publicUrl(req, filePath);
};

const prepareFlightImages = (req, source = {}, existing = {}) => {
  const uploads = source.uploads || {};
  const resolveSingle = (field, uploadField, folder) => {
    const uploaded = saveImage(req, uploads[uploadField], folder);
    if (uploaded) return uploaded;
    if (Object.prototype.hasOwnProperty.call(source, field)) return String(source[field] || "");
    return String(existing[field] || "");
  };

  const hasGalleryInput = Object.prototype.hasOwnProperty.call(source, "flightGallery");
  const gallery = hasGalleryInput ? normalizeArray(source.flightGallery) : normalizeArray(existing.flightGallery);
  const uploadedGallery = normalizeArray(uploads.gallery)
    .map((file) => saveImage(req, file, "gallery"))
    .filter(Boolean);

  return {
    flightBanner: resolveSingle("flightBanner", "flightBanner", "banners"),
    flightThumbnail: resolveSingle("flightThumbnail", "flightThumbnail", "thumbnails"),
    airlineLogo: resolveSingle("airlineLogo", "airlineLogo", "logos"),
    flightGallery: [...gallery.map((item) => String(item?.fileUrl || item || "")).filter(Boolean), ...uploadedGallery],
  };
};

module.exports = { prepareFlightImages };
