import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";

const defaultTemplates = [
  // ── Check-in ──────────────────────────────────────────────────────────────
  {
    name: "Guest Welcome (Check-in)",
    category: "check-in",
    body: `Welcome to {{hotel_name}}, {{guest_name}}! 🎉

Your check-in is confirmed. Here are your details:
🏨 Room No  : {{room_no}}
📅 Arrival  : {{arrival_date}}
📋 GRC No   : {{grc_no}}

We hope you have a wonderful stay. For any assistance, feel free to contact us anytime.

Warm regards,
Team {{hotel_name}}`,
  },
  {
    name: "Agent Booking Confirmation (Check-in)",
    category: "check-in",
    body: `Dear {{agent_name}},

This is to confirm the check-in of your guest at {{hotel_name}}.

👤 Guest   : {{guest_name}}
🏨 Room    : {{room_no}}
📅 Arrival : {{arrival_date}}
📋 GRC No  : {{grc_no}}

Thank you for booking with us!

Regards,
Team {{hotel_name}}`,
  },

  // ── Checkout ──────────────────────────────────────────────────────────────
  {
    name: "Checkout Confirmation",
    category: "checkout",
    body: `Dear {{guest_name}},

Thank you for staying at Mantri In! 🙏

We hope to see you again soon. Have a safe journey!

Warm regards,
Team Mantri In`,
  },
  {
    name: "Checkout Invoice Ready",
    category: "checkout",
    body: `Dear {{guest_name}},

Your invoice for your stay at {{hotel_name}} is ready.

🏨 Room     : {{room_no}}
🌙 Days     : {{days}}
💰 Amount   : {{amount}}
📋 GRC No   : {{grc_no}}

For any queries, please contact us at {{contact_number}}.

Thank you for choosing us!`,
  },

  // ── Reminder ──────────────────────────────────────────────────────────────
  {
    name: "Checkout Reminder (Day Before)",
    category: "reminder",
    body: `Dear {{guest_name}},

This is a friendly reminder that your checkout at {{hotel_name}} is scheduled for tomorrow, {{checkout_date}}.

🏨 Room No : {{room_no}}
📋 GRC No  : {{grc_no}}

Please feel free to contact us at {{contact_number}} if you need to extend your stay or have any questions.

Regards,
Team {{hotel_name}}`,
  },
  {
    name: "Payment Due Reminder",
    category: "reminder",
    body: `Dear {{guest_name}},

This is a gentle reminder that a payment of {{amount}} is due for your stay at {{hotel_name}}.

🏨 Room No : {{room_no}}
📋 GRC No  : {{grc_no}}

Kindly clear the dues at the reception or contact us at {{contact_number}}.

Thank you,
Team {{hotel_name}}`,
  },
  {
    name: "Upcoming Stay Reminder",
    category: "reminder",
    body: `Dear {{guest_name}},

We look forward to welcoming you at {{hotel_name}}!

Your arrival is scheduled on {{arrival_date}}.
📋 Booking Ref : {{grc_no}}

For early check-in or any special requests, please call us at {{contact_number}}.

See you soon!
Team {{hotel_name}}`,
  },

  // ── Promotion ─────────────────────────────────────────────────────────────
  {
    name: "Special Offer for Returning Guest",
    category: "promotion",
    body: `Dear {{guest_name}},

We miss you at {{hotel_name}}! 🌟

As a valued guest, we have an exclusive offer just for you:
🏷️ Get special discounted rates on your next stay.

Book now and mention GRC Ref {{grc_no}} to avail the offer.

Call us: {{contact_number}}

We look forward to hosting you again!
Team {{hotel_name}}`,
  },
  {
    name: "Weekend Deal Promotion",
    category: "promotion",
    body: `Hi {{guest_name}}! 👋

Enjoy a relaxing weekend at {{hotel_name}} with our exclusive weekend package!

✅ Complimentary breakfast
✅ Late checkout
✅ Special room rates

Book your stay now by calling {{contact_number}}.

We'd love to have you back!
Team {{hotel_name}}`,
  },

  // ── Custom ────────────────────────────────────────────────────────────────
  {
    name: "General Guest Message",
    category: "custom",
    body: `Dear {{guest_name}},

Thank you for choosing {{hotel_name}}.

Room No : {{room_no}}
GRC No  : {{grc_no}}

For assistance, contact us at {{contact_number}}.

Regards,
Team {{hotel_name}}`,
  },
  {
    name: "Feedback Request",
    category: "custom",
    body: `Dear {{guest_name}},

We hope you enjoyed your {{days}}-night stay at {{hotel_name}} (Room {{room_no}}).

Your feedback means a lot to us! Please take a moment to share your experience.

Thank you for staying with us. We hope to see you again soon!

Warm regards,
Team {{hotel_name}}`,
  },
];

/**
 * Inserts default templates that don't already exist (matched by name).
 * Safe to call on every server start — skips duplicates.
 */
export const seedWhatsAppTemplates = async () => {
  try {
    let inserted = 0;
    for (const tpl of defaultTemplates) {
      const exists = await WhatsAppTemplate.findOne({ name: tpl.name });
      if (!exists) {
        // Auto-extract variables
        const variables = [...new Set(
          (tpl.body.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.replace(/[{}]/g, ""))
        )];
        await WhatsAppTemplate.create({ ...tpl, variables });
        inserted++;
      }
    }
    if (inserted > 0) {
      console.log(`✅ WhatsApp templates seeded: ${inserted} new template(s) added`);
    }
  } catch (err) {
    console.error("WhatsApp template seed error:", err.message);
  }
};
