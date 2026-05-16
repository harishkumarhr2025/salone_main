import axios from "axios";

/**
 * Send a WhatsApp message via the secondary provider API.
 *
 * API format:
 *   GET https://<domain>/api?apikey=KEY&mobile=NUMBER&msg=TEXT
 *       &img1=URL &img2=URL &img3=URL &img4=URL &pdf=URL &video=URL (all optional)
 *
 * Response:
 *   { status: 1, message: "Success" }  → sent
 *   { status: 0, message: "Failed" }   → failed
 *
 * Status codes returned by the API:
 *   200 Success | 400 Invalid Number | 401 Empty Mobile | 402 Not 10-digit
 *   403 Invalid API Key | 404 Key Expired | 405 WhatsApp Session Inactive
 *   406 Key Validity Expired | 407 Invalid Image Extension
 *   408 Image >1MB | 409 Not PDF | 410 PDF >3MB | 411 Not Video | 412 Video >3MB
 *
 * Env vars:
 *   WA2_API_KEY   — your API key
 *   WA2_DOMAIN    — full base domain e.g. https://yourdomain.com
 */
const sendWhatsApp2 = async ({ to, body, img1, img2, img3, img4, pdf, video } = {}) => {
  const apiKey = process.env.WA2_API_KEY;
  const domain = process.env.WA2_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error("WA2_API_KEY or WA2_DOMAIN not configured in environment");
  }

  const mobile = String(to).replace(/\D/g, "");
  if (mobile.length !== 10) {
    throw new Error(`Invalid mobile number: must be 10 digits, got '${mobile}'`);
  }

  const params = {
    apikey: apiKey,
    mobile,
    msg: body,
    ...(img1  && { img1 }),
    ...(img2  && { img2 }),
    ...(img3  && { img3 }),
    ...(img4  && { img4 }),
    ...(pdf   && { pdf }),
    ...(video && { video }),
  };

  const response = await axios.get(`${domain.replace(/\/$/, "")}/api/`, {
    params,
    timeout: 15000,
    validateStatus: () => true, // never throw on HTTP status — read body ourselves
  });

  const data = response.data || {};

  // API uses HTTP status codes: 200 = success, 400-412 = various errors
  if (response.status !== 200 || data.status === 0) {
    const STATUS_MESSAGES = {
      400: "Invalid Number",
      401: "Empty Mobile Number",
      402: "Mobile Number is not 10 digits",
      403: "Invalid API Key",
      404: "API Key Expired",
      405: "WhatsApp Session Inactive",
      406: "Key Validity Expired",
      407: "Invalid Image Extension",
      408: "Image size exceeds 1MB",
      409: "File is not a PDF",
      410: "PDF size exceeds 3MB",
      411: "File is not a Video",
      412: "Video size exceeds 3MB",
    };
    const detail =
      data.message ||
      data.errormsg ||
      STATUS_MESSAGES[response.status] ||
      `HTTP ${response.status}`;
    throw new Error(`WhatsApp2 send failed: ${detail}`);
  }

  return data;
};

export default sendWhatsApp2;
