import sgMail from "@sendgrid/mail";

const SendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  try {
    const msg = {
      to: options.email,
      from: {
        email: process.env.EMAIL_FROM, // Actual email used for sending
        name: "Mantri In", // This will be displayed as the sender name
      },
      subject: options.subject,
      // text: "Don't know what is this text",
      html: options.html,
      attachments:
        options.attachments?.map((attachment) => ({
          content: attachment.content.toString("base64"),
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: "attachment",
        })) || [],
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error(
      "Email sending failed:",
      error.response?.body || error.message
    );
    throw error;
  }
};

export { SendEmail };
