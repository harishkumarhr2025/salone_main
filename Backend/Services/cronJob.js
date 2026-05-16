import cron from "node-cron";
import moment from "moment";
import {
  sendDailyReportEmail,
  generateSalonDailyReport,
} from "../controllers/ReportController.js";
import ScheduledWhatsApp from "../models/ScheduledWhatsAppModel.js";
import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";
import sendGlobal91Whatsapp from "../utils/sendGlobal91Whatsapp.js";
import Guest from "../models/GuestModel.js";

const businessName = process.env.BUSINESS_NAME || "Salone";

export const initScheduledWhatsAppCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const pending = await ScheduledWhatsApp.find({
        status: "pending",
        scheduledAt: { $lte: now },
      });

      for (const msg of pending) {
        try {
          await sendGlobal91Whatsapp({ to: msg.to, body: msg.body });
          msg.status = "sent";
          msg.sentAt = new Date();
        } catch (err) {
          msg.status = "failed";
          msg.error = err.message;
        }
        await msg.save();
      }

      if (pending.length > 0) {
        console.log(`WhatsApp scheduler: processed ${pending.length} message(s)`);
      }
    } catch (err) {
      console.error("WhatsApp scheduler error:", err.message);
    }
  });
};

export const initDailyReportCron = () => {
  cron.schedule(
    "55 22 * * *", // cron time
    async () => {
      console.log("🕒 Initiating daily report generation...");
      try {
        const timezone = "Asia/Kolkata";
        const today = moment().tz("Asia/Kolkata");
        const fromDate = today.clone().startOf("day").toDate();
        const toDate = today.clone().endOf("day").toDate();
        // const fromDate = moment().tz(timezone).subtract(5, "day");

        const { data: reportData } = await generateSalonDailyReport({
          fromDate,
          toDate,
        });

        if (
          !reportData ||
          !reportData.summary ||
          reportData.summary.totalServices === 0
        ) {
          console.log("⚠️ No services found for report date");
        }
        // }
        await sendDailyReportEmail(reportData);
        console.log("✅ Daily report sent successfully");
      } catch (error) {
        console.error("❌ Daily report failed:", error.message || error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
};

export const initBirthdayReschedulerCron = () => {
  cron.schedule(
    "35 18 * * *",
    async () => {
      try {
        const istOffset = 330 * 60 * 1000;
        const nowUTC = new Date();
        const nowIST = new Date(nowUTC.getTime() + istOffset);
        const todayMonth = nowIST.getUTCMonth();
        const todayDay = nowIST.getUTCDate();

        const guests = await Guest.find({
          date_of_birth: { $exists: true, $ne: null },
          Contact_number: { $exists: true, $ne: "" },
        });

        const todayGuests = guests.filter((g) => {
          const dob = new Date(g.date_of_birth);
          return dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDay;
        });

        if (todayGuests.length === 0) return;

        const [onDayTpl, dayBeforeTpl] = await Promise.all([
          WhatsAppTemplate.findOne({ name: "Birthday wish(on the day)", isActive: true }),
          WhatsAppTemplate.findOne({ name: "Birthday Wish(1 day before)", isActive: true }),
        ]);

        for (const guest of todayGuests) {
          const mobile = String(guest.Contact_number).replace(/\D/g, "");
          if (mobile.length < 10) continue;

          const fillBody = (body) =>
            body
              .replace(/\{\{guest_name\}\}/g, guest.Guest_name || "Guest")
              .replace(/\{\{hotel_name\}\}/g, businessName)
              .replace(/\{\{room_no\}\}/g, guest.Room_no || "")
              .replace(/\{\{grc_no\}\}/g, guest.GRC_No || "");

          const nextYear = nowIST.getUTCFullYear() + 1;
          const dob = new Date(guest.date_of_birth);
          const onDayAt = new Date(
            Date.UTC(nextYear, dob.getUTCMonth(), dob.getUTCDate()) - istOffset
          );
          const dayBeforeAt = new Date(onDayAt.getTime() - 24 * 60 * 60 * 1000);

          const docs = [];
          if (dayBeforeTpl)
            docs.push({
              to: mobile,
              body: fillBody(dayBeforeTpl.body),
              scheduledAt: dayBeforeAt,
              guestId: guest._id,
            });
          if (onDayTpl)
            docs.push({
              to: mobile,
              body: fillBody(onDayTpl.body),
              scheduledAt: onDayAt,
              guestId: guest._id,
            });

          if (docs.length > 0) {
            await ScheduledWhatsApp.insertMany(docs);
            console.log(
              `[BirthdayRescheduler] Rescheduled ${docs.length} msg(s) for ${mobile} -> ${nextYear}`
            );
          }
        }
      } catch (err) {
        console.error("Birthday rescheduler error:", err.message);
      }
    },
    { scheduled: true, timezone: "Asia/Kolkata" }
  );
};

export const initCheckoutReminderCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() + 60 * 60 * 1000);
      const to = new Date(now.getTime() + 61 * 60 * 1000);

      const guests = await Guest.find({
        status: { $nin: ["checkout", "checked-out"] },
        checkoutReminderSent: { $ne: true },
        Checkout_date: { $gte: from, $lt: to },
        Contact_number: { $exists: true, $ne: "" },
      });

      for (const guest of guests) {
        const checkoutStr = guest.Checkout_date
          ? new Date(guest.Checkout_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "today";

        const msg =
          `Dear ${guest.Guest_name},\n\n` +
          `This is a reminder that your checkout at ${businessName} is scheduled for today (${checkoutStr})` +
          (guest.Checkout_time
            ? ` at ${guest.Checkout_time}`
            : " in approximately 1 hour") +
          `.\n\n` +
          `Room No : ${guest.Room_no}\n` +
          `GRC No  : ${guest.GRC_No}\n\n` +
          `Please contact us at the reception if you need any assistance or wish to extend your stay.\n\n` +
          `Thank you for staying with us!\nTeam ${businessName}`;

        try {
          await sendGlobal91Whatsapp({ to: guest.Contact_number, body: msg });
          guest.checkoutReminderSent = true;
          await guest.save();
          console.log(
            `Checkout reminder sent to ${guest.Guest_name} (${guest.Contact_number})`
          );
        } catch (err) {
          console.error(`Checkout reminder failed for guest ${guest._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error("Checkout reminder cron error:", err.message);
    }
  });
};
