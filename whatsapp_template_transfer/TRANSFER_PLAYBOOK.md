# Transfer Playbook (Salon)

## 1) Backend wiring checklist

Merge these into Salon backend:

1. Register router in `app.js`
- import `WhatsAppRouter`
- add `app.use("/api/v1", WhatsAppRouter)`

2. Initialize cron + seed in `app.js`
- `seedWhatsAppTemplates()` after DB connect
- `initScheduledWhatsAppCron()`
- `initCheckoutReminderCron()`
- `initBirthdayReschedulerCron()`

3. Add router file
- `routers/WhatsAppRouter.js`

4. Add models
- `models/WhatsAppTemplateModel.js`
- `models/ScheduledWhatsAppModel.js`

5. Add controllers
- `controllers/WhatsAppTemplateController.js`
- `controllers/WhatsAppController.js`

6. Add provider utilities
- `utils/sendGlobal91Whatsapp.js`
- `utils/sendWhatsApp2.js`

7. Add cron implementation
- merge WhatsApp sections from `Services/cronJob.js`

8. Add seed scripts
- `scripts/seedWhatsAppTemplates.js`
- `scripts/listTemplates.js`
- `scripts/updateCheckoutTemplate.js`

## 2) Frontend wiring checklist

Merge these into Salon admin:

1. Add page
- `views/WhatsAppTemplates/WhatsAppTemplates.jsx`

2. Add modal
- `components/WhatsAppTemplateModal/WhatsAppTemplateModal.jsx`

3. Add route in admin router
- `/whatsapp-templates`

4. Add menu item in sidebar
- `href: "/whatsapp-templates"`

5. Optional flow integrations already included for hotel flows
- check-in selection UI in `GuestEntryModal.jsx`
- checkout selection UI in `CheckoutModal.jsx`

If Salon wants the same behavior for salon customer check-in/checkout, replicate the same payload field usage:
- `whatsappTemplateIds: selectedWaTemplates`

## 3) Payload/API contract

### Template CRUD
- `GET /api/v1/whatsapp/templates`
- `GET /api/v1/whatsapp/templates/:id`
- `POST /api/v1/whatsapp/templates`
- `PUT /api/v1/whatsapp/templates/:id`
- `DELETE /api/v1/whatsapp/templates/:id`

Template body uses dynamic placeholders, e.g. `{{guest_name}}`, `{{room_no}}`.

### Scheduling + tests
- `POST /api/v1/whatsapp/schedule`
- `POST /api/v1/whatsapp/test-schedule`
- `GET /api/v1/whatsapp/scheduled`
- `DELETE /api/v1/whatsapp/schedule/:id`

### WA2 immediate provider
- `POST /api/v1/whatsapp/wa2/send`
- `POST /api/v1/whatsapp/wa2/test`

## 4) Validation smoke test

1. Backend boots without import errors.
2. Seeder runs and templates are present.
3. `GET /api/v1/whatsapp/templates` returns 200.
4. Dashboard `/whatsapp-templates` loads template cards.
5. WA2 test send returns success.
6. Test schedule creates pending record; cron marks it sent.
