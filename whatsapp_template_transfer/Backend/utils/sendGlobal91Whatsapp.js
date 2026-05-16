import axios from "axios";

const sendGlobal91Whatsapp = async ({ to, body }) => {
  try {
    const apiKey = process.env.GLOBAL91_WHATSAPP_API_KEY;
    if (!apiKey) {
      console.error("Global91 WhatsApp API key not configured");
      return;
    }

    const mobile = String(to).replace(/\D/g, "");

    const response = await axios.get(
      "http://api.global91sms.marketing/wapp/v2/api/send",
      {
        params: {
          apikey: apiKey,
          mobile,
          msg: body,
        },
        timeout: 10000,
      }
    );

    console.log("Global91 WhatsApp sent:", response.data);
  } catch (error) {
    console.error("Global91 WhatsApp failed:", error.message);
  }
};

export default sendGlobal91Whatsapp;
