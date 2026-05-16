import dotenv from "dotenv";
import connectDB from "../DB/ConnectDB.js";
import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";

dotenv.config();

const newBody = `Dear {{guest_name}},

Thank you for staying at Mantri In! 🙏

We hope to see you again soon. Have a safe journey!

Warm regards,
Team Mantri In`;

const run = async () => {
  await connectDB(process.env.MONGO_URL_PROD);

  const result = await WhatsAppTemplate.findOneAndUpdate(
    { name: "Checkout Confirmation" },
    { body: newBody, variables: ["guest_name"] },
    { new: true }
  );

  if (result) {
    console.log(`✅ Updated: "${result.name}"`);
  } else {
    console.log("⚠️  Template 'Checkout Confirmation' not found in DB.");
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
