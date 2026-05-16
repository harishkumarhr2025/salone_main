import dotenv from "dotenv";
dotenv.config();
import connectDB from "../DB/ConnectDB.js";
import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";

await connectDB(process.env.MONGO_URL_PROD);
const templates = await WhatsAppTemplate.find({}, "name category body");
console.log(JSON.stringify(templates.map(t => ({ name: t.name, category: t.category, bodyPreview: t.body.slice(0, 60) })), null, 2));
process.exit(0);
