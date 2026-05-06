import moment from "moment";
import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";

pdfMake.vfs = pdfFonts.vfs;

const fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const generateSalonReportPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    const docDefinition = {
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            {
              stack: [
                {
                  text: "Likeme Family Salon Report",
                  fontSize: 20,
                  bold: true,
                  margin: [0, 0, 0, 5],
                },
                {
                  text: new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  fontSize: 12,
                  color: "#666",
                },
              ],
              alignment: "right",
              width: "*",
            },
          ],
          margin: [0, 0, 0, 30],
        },

        // Summary Cards
        {
          columns: [
            ...["totalCustomers", "totalServices", "totalRevenue"].map(
              (key) => ({
                width: "*",
                stack: [
                  {
                    text: reportData.summary[key].toLocaleString(),
                    fontSize: 24,
                    bold: true,
                    color: key === "totalRevenue" ? "#38a169" : "#2d3748",
                    alignment: "center",
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: key.replace("total", ""),
                    fontSize: 12,
                    color: "#718096",
                    alignment: "center",
                    textTransform: "uppercase",
                  },
                ],
                style: "summaryCard",
              })
            ),
          ],
          columnGap: 15,
          margin: [0, 0, 0, 30],
        },

        // Customer Highlights
        {
          text: "Customer Highlights",
          style: "sectionHeader",
          margin: [0, 0, 0, 10],
        },
        ...reportData.customerDistribution.map((customer) => ({
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: customer.customerName,
                  style: "customerName",
                  margin: [0, 0, 0, 4],
                },
                {
                  text: customer.mobileNumber,
                  style: "customerPhone",
                },
              ],
            },
            {
              width: "auto",
              stack: [
                {
                  text: `${customer.totalServices} Services`,
                  style: "serviceCount",
                  alignment: "right",
                },
                {
                  text: `₹${customer.totalRevenue}`,
                  style: "revenueHighlight",
                  alignment: "right",
                },
              ],
            },
          ],
          style: "customerCard",
          margin: [0, 0, 0, 8],
        })),

        // Service Breakdown
        {
          text: "Service Breakdown",
          style: "sectionHeader",
          margin: [0, 20, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Service", style: "tableHeader" },
                { text: "Category", style: "tableHeader" },
                { text: "Count", style: "tableHeader" },
                { text: "Revenue", style: "tableHeader" },
              ],
              ...reportData.serviceDistribution.map((service) => [
                {
                  text: [
                    { text: service.serviceName + "\n", bold: true },
                    { text: service.variant, fontSize: 10, color: "#718096" },
                  ],
                },
                { text: service.category, color: "#4a5568" },
                { text: service.count, color: "#4a5568" },
                {
                  text: `₹${service.totalRevenue}`,
                  color: "#38a169",
                  bold: true,
                },
              ]),
            ],
          },
          layout: "serviceTable",
        },

        // Tips Distribution
        {
          text: "Tips Distribution",
          style: "sectionHeader",
          margin: [0, 20, 0, 10],
        },
        ...reportData.tipTransactions.map((tip) => ({
          stack: [
            {
              text: `${tip.staffName}`,
              style: "tipStaffHeader",
              margin: [0, 0, 0, 8],
            },
            {
              table: {
                widths: ["*", "auto"],
                body: [
                  ...tip.tips.map((item) => [
                    {
                      text: [
                        { text: item.customerName, style: "tipCustomerName" },
                        {
                          text: `₹${item.tipAmount}`,
                          style: "tipAmount",
                          alignment: "right",
                        },
                        {
                          text: [
                            item.serviceName,
                            item.serviceCategory,
                            item.serviceVariant,
                          ]
                            .filter(Boolean)
                            .join(" • "),
                          style: "tipServiceDetails",
                        },
                      ],
                      margin: [0, 2],
                    },
                    {
                      text: `₹${item.tipAmount}`,
                      style: "tipAmount",
                      alignment: "right",
                    },
                  ]),
                ],
              },
              layout: "noBorders",
            },
            {
              text: `Total Tips: ₹${tip.totalTips}`,
              style: "tipTotal",
              margin: [0, 8, 0, 0],
            },
          ],
          style: "tipCard",
        })),

        // Footer
        {
          text: [
            `© ${new Date().getFullYear()} Likeme Family Salon\n`,
            `Generated on ${new Date().toLocaleString("en-IN")}`,
          ],
          alignment: "center",
          fontSize: 10,
          color: "#718096",
          margin: [0, 30],
        },
      ],
      styles: {
        sectionHeader: {
          fontSize: 16,
          bold: true,
          color: "#2d3748",
          borderBottom: "1px solid #2d3748",
          paddingBottom: 5,
          margin: [0, 0, 0, 15],
        },
        summaryCard: {
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 15,
        },
        customerCard: {
          border: "1px solid #e8edf3",
          borderRadius: 8,
          padding: 12,
          background: "#f8fafc",
          margin: [0, 0, 0, 8],
        },
        customerName: {
          fontSize: 14,
          bold: true,
          color: "#2d3748",
        },
        customerPhone: {
          fontSize: 12,
          color: "#718096",
          margin: [0, 4, 0, 0],
        },
        serviceCount: {
          fontSize: 12,
          color: "#4a5568",
        },
        revenueHighlight: {
          fontSize: 14,
          bold: true,
          color: "#38a169",
          margin: [0, 4, 0, 0],
        },
        tableHeader: {
          fillColor: "#f7fafc",
          bold: true,
          fontSize: 12,
          color: "#4a5568",
          padding: [8, 5],
        },
        serviceTable: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#e2e8f0",
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        tipCard: {
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          padding: 10,
          margin: [0, 0, 0, 15],
          background: "#ffffff",
        },
        tipStaffHeader: {
          fontSize: 14,
          bold: true,
          color: "#2d3748",
          background: "#f8fafc",
          padding: 8,
          borderRadius: 4,
        },
        tipCustomerName: {
          fontSize: 12,
          bold: true,
          color: "#2d3748",
        },
        tipServiceDetails: {
          fontSize: 10,
          color: "#718096",
          margin: [0, 4, 0, 0],
        },
        tipAmount: {
          fontSize: 12,
          bold: true,
          color: "#38a169",
        },
        tipTotal: {
          fontSize: 12,
          bold: true,
          color: "#2d3748",
          alignment: "right",
          background: "#f8fafc",
          padding: 6,
          borderRadius: 4,
        },
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 12,
        lineHeight: 1.4,
        color: "#2d3748",
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => resolve(buffer));
  });
};

// const generateMonthlySalonReportPDF = (reportData) => {
//   const date = new Date();
//   const currentMonth = date.getMonth();
//   const currentYear = date.getFullYear();

//   // Helper functions
//   const getCurrentMonthAndYear = () => {
//     const month = date.toLocaleString("default", { month: "long" });
//     return `${month}-${currentYear}`;
//   };

//   const parseDateFromDDMMYYYY = (str) => {
//     if (!str || typeof str !== "string") return null;
//     const [day, month, year] = str.split("-");
//     if (!day || !month || !year) return null;
//     const date = new Date(year, month - 1, day);
//     return isNaN(date.getTime()) ? null : date;
//   };

//   const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

//   return new Promise((resolve, reject) => {
//     const docDefinition = {
//       pageMargins: [40, 40, 40, 40],
//       content: [
//         // Main Title
//         {
//           text: "MONTH WISE REPORT",
//           fontSize: 18,
//           bold: true,
//           alignment: "center",
//           margin: [0, 0, 0, 10],
//         },

//         // Month Subtitle
//         {
//           text: `${getCurrentMonthAndYear()}`,
//           fontSize: 14,
//           alignment: "center",
//           margin: [0, 0, 0, 20],
//         },

//         // Data Table
//         {
//           table: {
//             headerRows: 1,
//             widths: ["auto", "auto", "auto", "*", "*", "*"],
//             body: [
//               [
//                 { text: "SL No.", style: "tableHeader" },
//                 { text: "DATE", style: "tableHeader" },
//                 { text: "DAY", style: "tableHeader" },
//                 { text: "CASH (₹)", style: "tableHeader" },
//                 { text: "UPI (₹)", style: "tableHeader" },
//                 { text: "TIPS (₹)", style: "tableHeader" },
//               ],
//               ...Array.from({ length: daysInMonth }, (_, i) => {
//                 const currentDate = new Date(currentYear, currentMonth, i + 1);
//                 const dateString = currentDate.toISOString().split("T")[0];
//                 const dailyData = reportData.dailyData.find((d) => {
//                   const parsedDate = parseDateFromDDMMYYYY(d.date);
//                   if (!parsedDate) return false;
//                   return parsedDate.toISOString().split("T")[0] === dateString;
//                 });

//                 return [
//                   i + 1,
//                   currentDate.toLocaleDateString("en-IN", {
//                     day: "2-digit",
//                     month: "short",
//                   }),
//                   currentDate
//                     .toLocaleDateString("en-IN", { weekday: "short" })
//                     .toUpperCase(),
//                   {
//                     text: dailyData?.cash?.toLocaleString("en-IN") || "-",
//                     alignment: "right",
//                   },
//                   {
//                     text: dailyData?.upi?.toLocaleString("en-IN") || "-",
//                     alignment: "right",
//                   },
//                   {
//                     text: dailyData?.totalTips?.toLocaleString("en-IN") || "-",
//                     alignment: "right",
//                   },
//                 ];
//               }),
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#444",
//             vLineColor: () => "#444",
//           },
//         },

//         // Summary Section
//         {
//           text: " ",
//           margin: [0, 20],
//         },
//         {
//           table: {
//             widths: ["*", "auto"],
//             body: [
//               [
//                 { text: "TOTAL CASH RECEIVED", bold: true },
//                 {
//                   text:
//                     reportData.summary.totalCash?.toLocaleString("en-IN") ||
//                     "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 { text: "UPI PAYMENT RECEIVED", bold: true },
//                 {
//                   text:
//                     reportData.summary.totalUpi?.toLocaleString("en-IN") || "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 { text: "TOTAL TIPS", bold: true },
//                 {
//                   text:
//                     reportData.summary.totalTips?.toLocaleString("en-IN") ||
//                     "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 {
//                   text: "TOTAL TURNOVER",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   margin: [0, 5],
//                 },
//                 {
//                   text:
//                     reportData.summary.totalRevenue?.toLocaleString("en-IN") ||
//                     "0",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   alignment: "right",
//                   margin: [0, 5],
//                 },
//               ],
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#444",
//             vLineColor: () => "#444",
//             paddingTop: () => 5,
//             paddingBottom: () => 5,
//           },
//           margin: [0, 10],
//         },
//       ],
//       styles: {
//         tableHeader: {
//           fillColor: "#f0f0f0",
//           bold: true,
//           fontSize: 12,
//           padding: [5, 2],
//           alignment: "center",
//         },
//       },
//       defaultStyle: {
//         fontSize: 11,
//         padding: [3, 2],
//         alignment: "center",
//       },
//     };

//     const pdfDoc = pdfMake.createPdf(docDefinition);
//     pdfDoc.getBuffer((buffer) => resolve(buffer));
//   });
// };
// const generateMonthlySalonReportPDF = (reportData) => {
//   const date = new Date();
//   const currentMonth = date.getMonth(); // Months are 0-indexed in JavaScript
//   const currentYear = date.getFullYear();

//   const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Get the number of days in the current month

//   const getCurrentMonthAndYear = () => {
//     const month = date.toLocaleString("default", { month: "long" });
//     return `${month}-${currentYear}`;
//   };
//   return new Promise((resolve, reject) => {
//     const docDefinition = {
//       pageMargins: [40, 40, 40, 40],
//       content: [
//         // Main Title
//         {
//           text: "MONTH WISE REPORT",
//           fontSize: 18,
//           bold: true,
//           alignment: "center",
//           margin: [0, 0, 0, 10],
//         },

//         // Month Subtitle
//         {
//           text: `${getCurrentMonthAndYear()}`,
//           fontSize: 14,
//           alignment: "center",
//           margin: [0, 0, 0, 20],
//         },

//         // Data Table
//         {
//           table: {
//             headerRows: 1,
//             widths: ["auto", 100, 100, 100, 100, 80],
//             body: [
//               // Table Headers
//               [
//                 { text: "SL No.", style: "tableHeader" },
//                 { text: "DATE", style: "tableHeader" },
//                 { text: "DAYS", style: "tableHeader" },
//                 { text: "CASH", style: "tableHeader" },
//                 { text: "UPI", style: "tableHeader" },
//                 { text: "TIPS", style: "tableHeader" },
//               ],
//               // Table Rows (using your screenshot data)
//               ...Array.from({ length: daysInMonth }, (_, i) => {
//                 const date = new Date(currentYear, currentMonth, i + 1); // May 2025 (month is 0-indexed)
//                 return [
//                   i + 1, // SL No.
//                   `${String(date.getDate()).padStart(2, "0")}-05-2025`, // DATE
//                   date
//                     .toLocaleDateString("en-US", { weekday: "long" })
//                     .toUpperCase(), // DAYS
//                   i === 14 ? "16,725" : "", // CASH (example data for row 15)
//                   i === 14 ? "8,075" : "", // UPI
//                   i === 14 ? "1,970" : "", // TIPS
//                 ];
//               }),
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#444",
//             vLineColor: () => "#444",
//           },
//         },

//         {
//           text: " ",
//           margin: [0, 20], // Spacer
//         },
//         {
//           table: {
//             widths: ["*", "auto"],
//             body: [
//               [
//                 { text: "TOTAL CASH RECEIVED", bold: true },
//                 {
//                   text: "reportData.totalCash.toLocaleString()",
//                   alignment: "right",
//                 },
//               ],
//               [
//                 { text: "UPI PAYMENT RECD", bold: true },
//                 {
//                   text: "reportData.upiPayment.toLocaleString()",
//                   alignment: "right",
//                 },
//               ],
//               [
//                 { text: "TIPS", bold: true },
//                 {
//                   text: "reportData.tips.toLocaleString()",
//                   alignment: "right",
//                 },
//               ],
//               [
//                 {
//                   text: "TOTAL TURNOVER",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   margin: [0, 5],
//                 },
//                 {
//                   text: "reportData.totalTurnover.toLocaleString()",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   alignment: "right",
//                   margin: [0, 5],
//                 },
//               ],
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#444",
//             vLineColor: () => "#444",
//             paddingTop: () => 5,
//             paddingBottom: () => 5,
//           },
//           margin: [0, 10],
//         },
//       ],
//       styles: {
//         tableHeader: {
//           fillColor: "#f0f0f0",
//           bold: true,
//           fontSize: 12,
//           padding: [5, 2],
//           alignment: "center",
//         },
//       },
//       defaultStyle: {
//         fontSize: 11,
//         padding: [3, 2],
//         alignment: "center",
//       },
//     };

//     const pdfDoc = pdfMake.createPdf(docDefinition);
//     pdfDoc.getBuffer((buffer) => resolve(buffer));
//   });
// };

// const generateMonthlySalonReportPDF = (reportData) => {
//   const date = new Date();
//   const currentMonth = date.getMonth();
//   const currentYear = date.getFullYear();

//   // Get transactions grouped by date from reportData
//   const dailyTransactions = reportData.dailyTransactions || {};

//   return new Promise((resolve, reject) => {
//     const docDefinition = {
//       pageMargins: [40, 40, 40, 40],
//       content: [
//         {
//           columns: [
//             {
//               stack: [
//                 {
//                   text: "MONTHLY SALON REPORT",
//                   fontSize: 20,
//                   bold: true,
//                   margin: [0, 0, 0, 5],
//                 },
//                 {
//                   text: new Date().toLocaleDateString("en-IN", {
//                     year: "numeric",
//                     month: "long",
//                   }),
//                   fontSize: 12,
//                   color: "#666",
//                 },
//               ],
//             },
//           ],
//           margin: [0, 0, 0, 20],
//         },

//         // Daily Transactions Table
//         {
//           table: {
//             headerRows: 1,
//             widths: ["auto", 100, 100, 100, 100, 80],
//             body: [
//               [
//                 { text: "Date", style: "tableHeader" },
//                 { text: "Day", style: "tableHeader" },
//                 { text: "Cash (₹)", style: "tableHeader" },
//                 { text: "UPI (₹)", style: "tableHeader" },
//                 { text: "Tips (₹)", style: "tableHeader" },
//                 { text: "Total (₹)", style: "tableHeader" },
//               ],
//               ...Array.from(
//                 {
//                   length: new Date(currentYear, currentMonth + 1, 0).getDate(),
//                 },
//                 (_, i) => {
//                   const currentDate = new Date(
//                     currentYear,
//                     currentMonth,
//                     i + 1
//                   );
//                   const dateKey = currentDate.toISOString().split("T")[0];
//                   const transactions = dailyTransactions[dateKey] || {};

//                   return [
//                     currentDate.toLocaleDateString("en-IN", {
//                       day: "2-digit",
//                       month: "short",
//                     }),
//                     currentDate
//                       .toLocaleDateString("en-IN", { weekday: "short" })
//                       .toUpperCase(),
//                     {
//                       text: transactions.cash
//                         ? transactions.cash.toLocaleString("en-IN")
//                         : "-",
//                       alignment: "right",
//                     },
//                     {
//                       text: transactions.upi
//                         ? transactions.upi.toLocaleString("en-IN")
//                         : "-",
//                       alignment: "right",
//                     },
//                     {
//                       text: transactions.tips
//                         ? transactions.tips.toLocaleString("en-IN")
//                         : "-",
//                       alignment: "right",
//                     },
//                     {
//                       text: (transactions.total || 0).toLocaleString("en-IN"),
//                       bold: true,
//                       alignment: "right",
//                       fillColor: "#f5f5f5",
//                     },
//                   ];
//                 }
//               ),
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#ddd",
//             vLineColor: () => "#ddd",
//           },
//         },

//         // Summary Section
//         {
//           text: " ",
//           margin: [0, 20],
//         },
//         {
//           table: {
//             widths: ["*", "auto"],
//             body: [
//               [
//                 { text: "TOTAL CASH", bold: true },
//                 {
//                   text: reportData.totalCash?.toLocaleString("en-IN") || "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 { text: "TOTAL UPI", bold: true },
//                 {
//                   text: reportData.totalUpi?.toLocaleString("en-IN") || "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 { text: "TOTAL TIPS", bold: true },
//                 {
//                   text: reportData.totalTips?.toLocaleString("en-IN") || "0",
//                   alignment: "right",
//                   bold: true,
//                 },
//               ],
//               [
//                 {
//                   text: "GRAND TOTAL",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   margin: [0, 5],
//                 },
//                 {
//                   text: reportData.grandTotal?.toLocaleString("en-IN") || "0",
//                   bold: true,
//                   fillColor: "#f0f0f0",
//                   alignment: "right",
//                   margin: [0, 5],
//                 },
//               ],
//             ],
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#444",
//             vLineColor: () => "#444",
//           },
//         },

//         // Footer
//         {
//           text: `Generated on ${new Date().toLocaleString("en-IN")}`,
//           alignment: "center",
//           fontSize: 10,
//           color: "#718096",
//           margin: [0, 30],
//         },
//       ],
//       styles: {
//         tableHeader: {
//           fillColor: "#f8fafc",
//           bold: true,
//           fontSize: 12,
//           padding: [8, 5],
//           alignment: "center",
//         },
//       },
//       defaultStyle: {
//         fontSize: 11,
//         padding: [3, 2],
//       },
//     };

//     const pdfDoc = pdfMake.createPdf(docDefinition);
//     pdfDoc.getBuffer((buffer) => resolve(buffer));
//   });
// };

const generateCumulativePdf = ({ reportData, month, year, grandTotal }) => {
  return new Promise((resolve) => {
    const docDefinition = {
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: "MONTHLY CUMULATIVE REPORT",
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: moment().month(month).year(year).format("MMMM YYYY"),
          fontSize: 14,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "*", "*"],
            body: [
              [
                { text: "SL No.", style: "tableHeader" },
                { text: "DATE", style: "tableHeader" },
                { text: "DAILY REVENUE (₹)", style: "tableHeader" },
                { text: "DAILY TIPS (₹)", style: "tableHeader" },
                { text: "CUMULATIVE TOTAL (₹)", style: "tableHeader" },
              ],
              ...reportData.map((day, index) => [
                index + 1,
                day.date,
                {
                  text: day.dailyRevenue.toLocaleString("en-IN"),
                  alignment: "right",
                },
                {
                  text: day.dailyTips.toLocaleString("en-IN"),
                  alignment: "right",
                },
                {
                  text: day.cumulativeTotal.toLocaleString("en-IN"),
                  alignment: "right",
                },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#444",
            vLineColor: () => "#444",
          },
        },
        {
          text: " ",
          margin: [0, 20],
        },
        {
          table: {
            widths: ["*", "auto"],
            body: [
              [
                { text: "TOTAL REVENUE", bold: true },
                {
                  text: grandTotal.toLocaleString("en-IN"),
                  alignment: "right",
                  bold: true,
                },
              ],
              [
                { text: "TOTAL TIPS", bold: true },
                {
                  text: reportData
                    .reduce((sum, day) => sum + day.dailyTips, 0)
                    .toLocaleString("en-IN"),
                  alignment: "right",
                  bold: true,
                },
              ],
              [
                {
                  text: "GRAND TOTAL",
                  bold: true,
                  fillColor: "#f0f0f0",
                  margin: [0, 5],
                },
                {
                  text: (
                    grandTotal +
                    reportData.reduce((sum, day) => sum + day.dailyTips, 0)
                  ).toLocaleString("en-IN"),
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "right",
                  margin: [0, 5],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#444",
            vLineColor: () => "#444",
          },
        },
      ],
      styles: {
        tableHeader: {
          fillColor: "#f0f0f0",
          bold: true,
          fontSize: 12,
          padding: [5, 2],
          alignment: "center",
        },
      },
      defaultStyle: {
        fontSize: 11,
        padding: [3, 2],
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer(resolve);
  });
};

const generateEmployeeReportPDF = () => {
  const employeeData = {
    ANJU: {
      transactions: [
        { billNo: 300, cash: 0, upi: 200, tips: 20 },
        { billNo: 301, cash: 75, upi: 0, tips: 20 },
        // ... Add all other transactions
      ],
      totals: { cash: 4025, upi: 2075, tips: 400, turnover: 6500 },
    },
    GRAND_TOTALS: {
      employees: [
        { name: "NOOR", cash: 4700, upi: 2450, tips: 520 },
        { name: "ARIF", cash: 4300, upi: 1450, tips: 550 },
        { name: "ANJU", cash: 4025, upi: 2075, tips: 400 },
        { name: "RENUKA", cash: 3700, upi: 2100, tips: 500 },
      ],
      grandTotal: { cash: 16725, upi: 8075, tips: 1970, turnover: 26770 },
    },
  };

  return new Promise((resolve, reject) => {
    const docDefinition = {
      pageMargins: [40, 40, 40, 40],
      content: [
        // Employee Table
        {
          text: "EMPLOYEE - ANJU",
          style: "employeeHeader",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "BILL NO", style: "tableHeader" },
                { text: "CASH", style: "tableHeader" },
                { text: "UPI", style: "tableHeader" },
                { text: "TIPS", style: "tableHeader" },
              ],
              // Transaction Rows
              ...employeeData.ANJU.transactions.map((t) => [
                t.billNo,
                `₹${t.cash.toLocaleString()}`,
                `₹${t.upi.toLocaleString()}`,
                `₹${t.tips.toLocaleString()}`,
              ]),
              // Total Row
              [
                { text: "TOTAL", style: "totalLabel" },
                {
                  text: `₹${employeeData.ANJU.totals.cash.toLocaleString()}`,
                  style: "totalValue",
                },
                {
                  text: `₹${employeeData.ANJU.totals.upi.toLocaleString()}`,
                  style: "totalValue",
                },
                {
                  text: `₹${employeeData.ANJU.totals.tips.toLocaleString()}`,
                  style: "totalValue",
                },
              ],
            ],
          },
          layout: "tableLayout",
        },

        // Grand Total Table
        {
          text: "\nGRAND TOTAL",
          style: "sectionHeader",
          margin: [0, 20, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "EMPLOYEE", style: "tableHeader" },
                { text: "CASH", style: "tableHeader" },
                { text: "UPI", style: "tableHeader" },
                { text: "TIPS", style: "tableHeader" },
              ],
              ...employeeData.GRAND_TOTALS.employees.map((e) => [
                e.name,
                `₹${e.cash.toLocaleString()}`,
                `₹${e.upi.toLocaleString()}`,
                `₹${e.tips.toLocaleString()}`,
              ]),
              [
                { text: "TOTAL TURNOVER", style: "grandTotalLabel" },
                {
                  text: `₹${employeeData.GRAND_TOTALS.grandTotal.cash.toLocaleString()}`,
                  style: "grandTotalValue",
                },
                {
                  text: `₹${employeeData.GRAND_TOTALS.grandTotal.upi.toLocaleString()}`,
                  style: "grandTotalValue",
                },
                {
                  text: `₹${employeeData.GRAND_TOTALS.grandTotal.tips.toLocaleString()}`,
                  style: "grandTotalValue",
                },
              ],
            ],
          },
          layout: "tableLayout",
        },
      ],
      styles: {
        employeeHeader: {
          fontSize: 16,
          bold: true,
          color: "#2d3748",
        },
        tableHeader: {
          fillColor: "#f0f0f0",
          bold: true,
          fontSize: 12,
          padding: [8, 4],
          alignment: "center",
        },
        totalLabel: {
          fillColor: "#e2e8f0",
          bold: true,
          padding: [8, 4],
        },
        totalValue: {
          fillColor: "#e2e8f0",
          bold: true,
          padding: [8, 4],
          alignment: "right",
        },
        grandTotalLabel: {
          fillColor: "#c6f6d5",
          bold: true,
          padding: [8, 4],
        },
        grandTotalValue: {
          fillColor: "#c6f6d5",
          bold: true,
          padding: [8, 4],
          alignment: "right",
        },
        tableLayout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#444",
          vLineColor: () => "#444",
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: "#2d3748",
        },
      },
      defaultStyle: {
        fontSize: 11,
        padding: [4, 2],
        font: "Roboto",
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => resolve(buffer));
  });
};

const generateDailyServicePDF = () => {
  return new Promise((resolve, reject) => {
    const docDefinition = {
      pageMargins: [30, 30, 30, 30],
      pageOrientation: "landscape",
      header: {
        columns: [
          // Left Column - Date
          {
            text: "Date: 15/05/2025",
            fontSize: 11,
            margin: [0, 20, 0, 0],
            width: "30%",
          },
          // Center Column - Main Title
          {
            text: "DAILY SERVICE BOOK",
            fontSize: 18,
            bold: true,
            alignment: "center",
            margin: [0, 20, 0, 0],
            width: "40%",
          },
          // Right Column - Shift & Incharge
          {
            stack: [
              { text: "Shift: Morning", fontSize: 11 },
              { text: "Incharge: Manager Name", fontSize: 11 },
            ],
            alignment: "right",
            margin: [0, 20, 0, 0],
            width: "30%",
          },
        ],
        margin: [40, 20, 40, 0], // Match page margins
        style: "header",
      },
      content: [
        // Header Information
        {
          columns: [
            {
              text: "Date: 15/05/2025",
              fontSize: 11,
              margin: [0, 0, 0, 15],
            },
            {
              stack: [
                { text: "Shift: Morning", fontSize: 11 },
                { text: "Incharge: Manager Name", fontSize: 11 },
              ],
              alignment: "right",
              margin: [0, 0, 0, 15],
            },
          ],
        },

        // Main Service Table
        {
          table: {
            headerRows: 1,
            widths: [40, 65, 60, 50, 50, 55, 55, 55, 55, 55, 60],
            body: [
              // Table Header
              [
                { text: "BILL NO", style: "tableHeader" },
                { text: "MOBILE NO", style: "tableHeader" },
                { text: "NAME", style: "tableHeader" },
                { text: "IN TIME", style: "tableHeader" },
                { text: "OUT TIME", style: "tableHeader" },
                { text: "SERVICE-1", style: "tableHeader" },
                { text: "SERVICE-2", style: "tableHeader" },
                { text: "SERVICE-3", style: "tableHeader" },
                { text: "SERVICE-4", style: "tableHeader" },
                { text: "SERVICE-5", style: "tableHeader" },
                { text: "EMPLOYEE", style: "tableHeader" },
              ],
              // Table Rows
              [
                260,
                "923020787",
                "Shashi",
                "10:00 AM",
                "10:30 AM",
                "Eyebrow",
                "Upper Lip",
                "N/A",
                "N/A",
                "N/A",
                "Anju",
              ],
              [
                261,
                "9449550851",
                "Harish",
                "11:00 AM",
                "11:30 AM",
                "Massage",
                "Cleanup",
                "Facial",
                "N/A",
                "N/A",
                "Arif",
              ],
              [
                262,
                "9449550852",
                "Ramesh",
                "11:30 AM",
                "11:45 AM",
                "Hair Color",
                "Shaving",
                "Hair Spa",
                "N/A",
                "N/A",
                "Noor",
              ],
              [
                263,
                "9449550853",
                "Giri",
                "01:00 PM",
                "10:30 AM",
                "Haircut",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "Renu",
              ],
              [
                264,
                "9449550854",
                "Gangadar",
                "02:00 PM",
                "10:30 AM",
                "Beard",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "Anju",
              ],
              [
                265,
                "9449550855",
                "Sumitra",
                "03:00 PM",
                "10:30 AM",
                "Hair Wash",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "Sonya",
              ],
              [
                266,
                "9449550856",
                "Palavei",
                "04:00 PM",
                "10:30 AM",
                "Hair Dye",
                "Facial",
                "Bleach",
                "Pedicure",
                "Manicure",
                "Anju",
              ],
              [
                267,
                "9449550858",
                "Reshmi",
                "05:00 PM",
                "10:30 AM",
                "Saree Drape",
                "Eyebrow",
                "Upper Lip",
                "N/A",
                "N/A",
                "Sonya",
              ],
              [
                268,
                "9449550859",
                "Shakuntala",
                "06:00 PM",
                "10:30 AM",
                "Haircut",
                "Facial",
                "Eyebrow",
                "Pedicure",
                "N/A",
                "Arif",
              ],
              [
                269,
                "9449550860",
                "Savitha",
                "07:00 PM",
                "10:30 AM",
                "Pedicure",
                "Upper Lip",
                "N/A",
                "N/A",
                "N/A",
                "Noor",
              ],
              [
                270,
                "9449550861",
                "Sudha",
                "08:00 PM",
                "10:30 AM",
                "Upper Lip",
                "Jawline",
                "Bleach",
                "Manicure",
                "Hair Spa",
                "Waseem",
              ],
              [
                271,
                "9449550862",
                "Ramya",
                "09:00 PM",
                "10:30 AM",
                "Hair Dye",
                "N/A",
                "N/A",
                "N/A",
                "N/A",
                "Anju",
              ],
            ],
          },
          layout: {
            hLineWidth: (i) => (i === 0 ? 1 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => "#444",
            vLineColor: () => "#444",
            paddingTop: (i) => (i === 0 ? 8 : 5),
            paddingBottom: (i) => (i === 0 ? 8 : 5),
          },
          alignment: "center",
        },

        // Footer
        {
          text: "Page 1 of 1",
          alignment: "right",
          margin: [0, 20, 30, 0],
          fontSize: 10,
          color: "#666",
        },
      ],
      styles: {
        tableHeader: {
          fillColor: "#f8f9fa",
          bold: true,
          fontSize: 10,
          padding: [5, 3],
          alignment: "center",
        },
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.2,
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getBuffer((buffer) => resolve(buffer));
  });
};

export {
  generateSalonReportPDF,
  // generateMonthlySalonReportPDF,
  generateEmployeeReportPDF,
  generateCumulativePdf,
  generateDailyServicePDF,
};
