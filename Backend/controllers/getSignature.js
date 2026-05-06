import cloudinary from "../config/cloudinaryConfig.js";

export const getSignature = async (req, res) => {
  const { folder, imageCount } = req.body;
  console.log("req body:", req.body);
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

  if (!folder || typeof folder !== "string") {
    return res.status(400).json({
      success: false,
      message: "Valid folder name is required",
    });
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0 || imageCount > 10) {
    return res.status(400).json({
      success: false,
      message: "Image count must be a positive integer (max 10)",
    });
  }
  try {
    if (!cloudName || !cloudApiKey || !cloudApiSecret) {
      const missing = [
        !cloudName && "cloudName",
        !cloudApiKey && "apiKey",
        !cloudApiSecret && "apiSecret",
      ].filter(Boolean);

      return res.status(500).json({
        success: false,
        message:
          "Cloudinary is not configured on server. Set CLOUDINARY_URL or set CLOUD_NAME/CLOUDINARY_NAME/CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY/CLOUD_API_KEY + CLOUDINARY_API_SECRET/CLOUD_API_SECRET.",
        missing,
      });
    }

    // 1. Enhanced validation

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatures = [];

    for (let i = 0; i < imageCount; i++) {
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
        },
        cloudApiSecret
      );
      signatures.push({ timestamp, signature });
    }

    res.setHeader("Cache-Control", "no-store");
    console.log("signatures:", signatures);
    return res.status(200).json({
      success: true,
      signatures,
      cloudName,
      apiKey: cloudApiKey,
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    // 6. Secure error response
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
