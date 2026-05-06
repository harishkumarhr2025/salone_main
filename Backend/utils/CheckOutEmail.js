export const CheckOutEmail = ({
  guest_name,
  booking_reference,
  CheckIn,
  CheckOut,
  RoomRent,
  gstAmount,
  TotalCharged,
  contact_no,
}) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5;">

    <!-- Main Container -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px;">
        <!-- Hotel Header -->
        <tr>
            <td style="padding: 25px; background: #2A5C97; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 15px 0 0 0; font-size: 24px;">Mantri In</h1>
                <h1 style="color: #ffffff; margin: 15px 0 0 0; font-size: 24px;">Checkout Confirmation</h1>
            </td>
        </tr>

        <!-- Guest Content -->
        <tr>
            <td style="padding: 30px 25px;">
                <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">Dear ${guest_name},</p>
                <p style="color: #333; line-height: 1.6; margin: 0 0 20px 0;">Thank you for choosing Mantri In! Your checkout is complete. Find your stay details and invoice below:</p>

                <!-- Stay Details -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="color: #2A5C97; margin: 0 0 15px 0; font-size: 18px;">Stay Summary</h3>
                    <table width="100%" style="margin: 10px 0;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Booking Reference:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #333;">#${booking_reference}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Check-in:</td>
                            <td style="padding: 8px 0; color: #333;">${CheckIn}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Check-out:</td>
                            <td style="padding: 8px 0; color: #333;">${CheckOut}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Room Rent:</td>
                            <td style="padding: 8px 0; color: #333;">${RoomRent}</td>
                        </tr>
                         <tr>
                            <td style="padding: 8px 0; color: #666;">GST(18%):</td>
                            <td style="padding: 8px 0; color: #333;">${gstAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Total Charged:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: bold;">${TotalCharged}</td>
                        </tr>
                    </table>
                </div>

                <!-- Invoice Section -->
                <div style="background: #e9f5fe; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                    <h3 style="color: #2A5C97; margin: 0 0 12px 0; font-size: 16px;">📄 Invoice Attached</h3>
                    <p style="margin: 0; color: #333; line-height: 1.5;">
                        Your detailed invoice is attached as a PDF. This includes:<br>
                        • Room charges<br>
                        • Tax breakdown<br>
                        • Additional services used
                    </p>
                </div>

                <!-- Next Steps -->
                <div style="margin: 25px 0;">
                    <h3 style="color: #2A5C97; margin: 0 0 12px 0; font-size: 16px;">Next Steps</h3>
                    <p style="margin: 0 0 10px 0; color: #333;">
                        • Receipt also sent to Whatsapp No.- ${contact_no}<br>
                        • Allow 3-5 business days for deposit refund (if applicable)<br>
                        • Review your invoice for payment details
                    </p>
                </div>

                <!-- Hotel Contact -->
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <p style="color: #666; line-height: 1.6; margin: 0 0 8px 0;">Need assistance?</p>
                    <p style="margin: 0; color: #333;">
                        📞 Front Desk: 9900064328<br>
                        📧 Email: <a href="mailto:[labeltek@hotmail.com]" style="color: #2A5C97; text-decoration: none;">labeltek@hotmail.com</a><br>
                        🏨 Address:  NO 8/1, Platform Road, Near Mantri Mall, Platform Rd, next to Apollo Hospital, Seshadripuram, Bengaluru, Karnataka 560020</a>
                    </p>
                </div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 20px 25px; background: #2A5C97; text-align: center; border-radius: 0 0 8px 8px;">
                <p style="color: #ffffff; font-size: 12px; margin: 5px 0;">
                    Mantri In • Seshadripuram • Bengaluru <br>
                </p>
                <p style="color: rgba(255,255,255,0.8); font-size: 10px; margin: 10px 0 0 0;">
                    This is an automated message - please do not reply directly
                </p>
            </td>
        </tr>
    </table>

</body>
</html>`;
};
