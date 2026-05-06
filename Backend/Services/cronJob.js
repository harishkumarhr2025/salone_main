import cron from "node-cron";
import moment from "moment";
import {
  sendDailyReportEmail,
  generateSalonDailyReport,
} from "../controllers/ReportController.js";

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
