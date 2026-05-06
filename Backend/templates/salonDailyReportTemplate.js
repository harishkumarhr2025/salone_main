export const salonDailyReportTemplate = (report) => `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fb;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center" style="padding: 25px 10px;">
                <!-- Main Container -->
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 800px; background: #ffffff; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #6366f1; padding: 30px 20px; text-align: center;">
                            <img src="https://cdn-icons-png.flaticon.com/512/185/185932.png" width="60" style="filter: brightness(0) invert(1); margin-bottom: 15px;">
                            <h1 style="color: #ffffff; margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 600;">
                                Likeme Family Salon Report
                            </h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                                ${new Date().toLocaleDateString("en-IN", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                            </p>
                        </td>
                    </tr>

                    <!-- Summary Cards -->
                    <tr>
                        <td style="padding: 25px 20px; background: #ffffff;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    ${[
                                      report.summary.totalCustomers,
                                      report.summary.totalServices,
                                      report.summary.totalRevenue,
                                    ]
                                      .map(
                                        (value, index) => `
                                        <td width="${
                                          100 / 3
                                        }%" style="padding: 10px; text-align: center;">
                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
                                                <tr>
                                                    <td style="font-size: 28px; font-weight: 700; color: ${
                                                      index === 0
                                                        ? "#6366f1"
                                                        : index === 1
                                                        ? "#10b981"
                                                        : "#ef4444"
                                                    };">
                                                        ${
                                                          index === 2 ? "₹" : ""
                                                        }${value}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-top: 8px; font-size: 14px; color: #64748b;">
                                                        ${
                                                          [
                                                            "Total Customers",
                                                            "Total Services",
                                                            "Total Revenue",
                                                          ][index]
                                                        }
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>`
                                      )
                                      .join("")}
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Customer Highlights -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="padding: 0 0 15px; font-size: 20px; font-weight: 600; color: #1e293b;">
                                        Customer Highlights
                                    </td>
                                </tr>
                                ${report.customerDistribution
                                  .map(
                                    (customer) => `
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                                            <tr>
                                                <td width="60%" style="font-weight: 600; color: #1e293b;">
                                                    ${customer.customerName}<br>
                                                    <span style="font-size: 13px; color: #64748b;">${customer.mobileNumber}</span>
                                                </td>
                                                <td width="40%" style="text-align: right;">
                                                    <div style="font-size: 16px; color: #6366f1; font-weight: 600;">
                                                        ${customer.totalServices} Services
                                                    </div>
                                                    <div style="font-size: 14px; color: #16a34a;">
                                                        ₹${customer.totalRevenue}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>`
                                  )
                                  .join("")}
                            </table>
                        </td>
                    </tr>

                    <!-- Tips Distribution Section -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="padding: 0 0 15px; font-size: 20px; font-weight: 600; color: #1e293b;">
                                        Tips Distribution
                                    </td>
                                </tr>
                                ${
                                  report.tipTransactions &&
                                  report.tipTransactions.length > 0
                                    ? report.tipTransactions
                                        .map(
                                          (staffTip) => `
                                          
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                                    <tr>
                                                        <td style="padding: 16px; background: #6366f1;">
                                                            <table width="100%">
                                                                <tr>
                                                                    <td width="60%" style="color: #ffffff; font-weight: 600;">
                                                                        ${
                                                                          staffTip.staffName
                                                                        }
                                                                    </td>
                                                                    <td width="40%" style="text-align: right; color: #ffffff;">
                                                                        Total Tips: ₹${staffTip.totalTips?.toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    ${staffTip.tips
                                                      .map(
                                                        (tip) => `
                                                        <tr>
                                                            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                                <table width="100%">
                                                                    <tr>
                                                                        <td width="60%">
                                                                            <div style="font-weight: 500; color: #1e293b;">${tip.customerName}</div>
                                                                            <div style="font-size: 12px; color: #64748b;">
                                                                                ${tip.serviceName} 
                                                                                <span style="color: #94a3b8;">•</span>
                                                                                ${tip.serviceCategory}
                                                                                <span style="color: #94a3b8;">•</span>
                                                                                ${tip.serviceVariant}
                                                                            </div>
                                                                        </td>
                                                                        <td width="40%" style="text-align: right;">
                                                                            <div style="font-weight: 600; color: #16a34a;">
                                                                                ₹${tip.tipAmount}
                                                                            </div>
                                                                            
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>`
                                                      )
                                                      .join("")}
                                                </table>
                                            </td>
                                        </tr>`
                                        )
                                        .join("")
                                    : `
                                    <tr>
                                        <td style="padding: 20px; text-align: center; background: #f8fafc; border-radius: 8px;">
                                            <div style="color: #64748b; font-size: 14px;">
                                                No tips recorded during this period
                                            </div>
                                        </td>
                                    </tr>`
                                }
                            </table>
                        </td>
                    </tr>

                    <!-- Service Breakdown -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="padding: 0 0 15px; font-size: 20px; font-weight: 600; color: #1e293b;">
                                        Service Breakdown
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                            <tr style="background: #f1f5f9;">
                                                <th style="padding: 14px; text-align: left; font-size: 13px; color: #64748b;">Service</th>
                                                <th style="padding: 14px; text-align: center; font-size: 13px; color: #64748b;">Category</th>
                                                <th style="padding: 14px; text-align: center; font-size: 13px; color: #64748b;">Count</th>
                                                <th style="padding: 14px; text-align: right; font-size: 13px; color: #64748b;">Revenue</th>
                                            </tr>
                                            ${report.serviceDistribution
                                              .map(
                                                (service, index) => `
                                            <tr style="${
                                              index % 2 === 0
                                                ? "background: #ffffff;"
                                                : ""
                                            }">
                                                <td style="padding: 14px; border-bottom: 1px solid #e2e8f0;">
                                                    <div style="font-weight: 500; color: #1e293b;">${
                                                      service.serviceName
                                                    }</div>
                                                    <div style="font-size: 12px; color: #64748b;">${
                                                      service.varient
                                                    }</div>
                                                </td>
                                                <td style="padding: 14px; text-align: center; color: #475569; border-bottom: 1px solid #e2e8f0;">${
                                                  service.category
                                                }</td>
                                                <td style="padding: 14px; text-align: center; color: #475569; border-bottom: 1px solid #e2e8f0;">${
                                                  service.count
                                                }</td>
                                                <td style="padding: 14px; text-align: right; color: #16a34a; border-bottom: 1px solid #e2e8f0;">
                                                    ₹${service.totalRevenue}
                                                </td>
                                            </tr>
                                            `
                                              )
                                              .join("")}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #1e293b; padding: 20px; text-align: center;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="color: rgba(255,255,255,0.6); font-size: 12px;">
                                        © ${new Date().getFullYear()} Likeme Family Salon<br>
                                        Generated on ${new Date().toLocaleString(
                                          "en-IN"
                                        )}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
