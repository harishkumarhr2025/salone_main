import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const parseCloudinaryUrl = () => {
  try {
    const raw = process.env.CLOUDINARY_URL;
    if (!raw) return {};

    const parsed = new URL(raw);
    if (parsed.protocol !== "cloudinary:") return {};

    return {
      cloudName: parsed.hostname || "",
      apiKey: decodeURIComponent(parsed.username || ""),
      apiSecret: decodeURIComponent(parsed.password || ""),
    };
  } catch {
    return {};
  }
};

const cloudFromUrl = parseCloudinaryUrl();
const cloudName =
  process.env.CLOUD_NAME ||
  process.env.CLOUDINARY_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  cloudFromUrl.cloudName;
const cloudApiKey =
  process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY || cloudFromUrl.apiKey;
const cloudApiSecret =
  process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET || cloudFromUrl.apiSecret;

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudApiKey,
  api_secret: cloudApiSecret,
});

export default cloudinary;
