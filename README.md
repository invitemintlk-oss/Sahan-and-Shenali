# Sahan & Shenali · Wedding Invitation

Saturday 21 August 2027 · Church 4:00 PM (St. Sebastian's Church, Katuwapitiya) · Reception 7:00 PM (Ranowell Hotel, Negombo) · RSVP by 21.07.2027

## Run locally

**Prerequisites:** Node.js 22

1. `npm install`
2. Create `.env.local` with `VITE_SHEETS_ENDPOINT="https://script.google.com/macros/s/.../exec"`
3. `npm run dev`

Couple names used by the admin page and the WhatsApp message live in [`src/config.ts`](src/config.ts).

## Pages

| URL | What it shows |
| --- | --- |
| `/` | The invitation |
| `/{guestName}?p={prefix}` | Personalized invitation: "We cordially invite Mr. Sanjaya to celebrate our special day with us." |
| `/admin` | Link generator: pick a prefix, type a name, then copy the link or the full WhatsApp message |

Prefix keys: `mr`, `mrs`, `miss`, `mr-mrs`, `family`, `dear` (the "Dear" style adds no `?p=`).

Hosting: `vercel.json` (Vercel) and `public/_redirects` (Netlify) send every path to `index.html`, so guest links don't return 404.

## RSVP and Wishes in Google Sheets

The Apps Script in [`google-apps-script/Code.gs`](google-apps-script/Code.gs) saves to this spreadsheet:
https://docs.google.com/spreadsheets/d/19vBufqGiKGF_m6HpOXyWaK2dWhsP3ad9am_dSz7-o7g

It creates two sheets with styled header rows automatically:

- **RSVP**: Submitted At, Name, Attendance, Invited As, Page URL, User Agent
- **Wishes**: Submitted At, Name, Message, Invited As, Show on Website (checkbox), Page URL, User Agent

To hide a wish from the website, untick its **Show on Website** box.

### Setup

1. Open the spreadsheet and go to **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the contents of `google-apps-script/Code.gs`, then save.
3. Select the `setup` function and click **Run**. Approve the permissions; this creates both sheets.
4. **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*.
5. Copy the Web App URL (it ends in `/exec`) into `VITE_SHEETS_ENDPOINT`, both in `.env.local` and in your hosting provider's environment variables. Then redeploy the site.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.
