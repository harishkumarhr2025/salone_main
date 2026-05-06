import twilio from "twilio";

const sendWhatsappMessage = async (whatsappMessageOptions) => {
  console.log("whatsappMessageOptions:", whatsappMessageOptions);
  try {
    console.log(
      "Twilio:",
      whatsappMessageOptions,
      process.env.TWILIO_WHATSAPP_NO
    );
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      body: whatsappMessageOptions.body,
      from: process.env.TWILIO_WHATSAPP_NO,
      to: `whatsapp:${whatsappMessageOptions.to}`,
    });
    console.log("Whatsapp Message Sent");
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
};

export default sendWhatsappMessage;
