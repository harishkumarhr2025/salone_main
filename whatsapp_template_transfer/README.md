# WhatsApp Template Transfer Pack

This folder contains all code and setup references needed to move the WhatsApp template system + automated messaging flow into the Salon part.

## What is included

### Backend files
- `Backend/app.js`
- `Backend/controllers/WhatsAppController.js`
- `Backend/controllers/WhatsAppTemplateController.js`
- `Backend/controllers/GuestController.js`
- `Backend/models/WhatsAppTemplateModel.js`
- `Backend/models/ScheduledWhatsAppModel.js`
- `Backend/routers/WhatsAppRouter.js`
- `Backend/Services/cronJob.js`
- `Backend/scripts/seedWhatsAppTemplates.js`
- `Backend/scripts/listTemplates.js`
- `Backend/scripts/updateCheckoutTemplate.js`
- `Backend/utils/sendGlobal91Whatsapp.js`
- `Backend/utils/sendWhatsApp2.js`

### Admin files
- `admin/src/views/WhatsAppTemplates/WhatsAppTemplates.jsx`
- `admin/src/components/WhatsAppTemplateModal/WhatsAppTemplateModal.jsx`
- `admin/src/components/GuestEntryModal/GuestEntryModal.jsx`
- `admin/src/components/CheckoutModal/CheckoutModal.jsx`
- `admin/src/routes/Router.js`
- `admin/src/layouts/full/sidebar/MenuItems.js`

### Setup references
- `Backend/.env.whatsapp.keys`
- `TRANSFER_PLAYBOOK.md`

## How to use in Salon

1. Copy files from this folder into the Salon codebase with the same paths.
2. For files that already exist in Salon (`app.js`, `cronJob.js`, route/menu files, and controllers), do **merge** (do not blindly overwrite).
3. Add env variables from `Backend/.env.whatsapp.keys` into Salon backend `.env`.
4. Start backend and verify API routes:
   - `GET /api/v1/whatsapp/templates`
   - `POST /api/v1/whatsapp/templates`
   - `POST /api/v1/whatsapp/test-schedule`
   - `POST /api/v1/whatsapp/wa2/test`
5. Open dashboard route `/whatsapp-templates` and test template create/edit/delete.
6. Send one WA2 instant test and one scheduled test.

## Important note (Windows vs Linux)

Some existing imports use `sendGlobal91WhatsApp.js` while the file here is `sendGlobal91Whatsapp.js`.
- On Windows this usually works.
- On Linux servers this can fail due to case-sensitive paths.

If Salon runs on Linux, keep the import/file name casing exactly consistent.
