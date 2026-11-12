# Automatic WhatsApp order confirmation

When a customer places an order, the shop sends them a WhatsApp message with
two buttons, **Confirmer** and **Annuler**. Their answer updates the order in
`/admin` by itself (status *Confirmed* / *Cancelled*) and they get a short
thank-you reply. Typed answers such as "oui", "wakha", "نعم" or "non" work too.
Any other message they send is saved in the order's history.

It uses Meta's official **WhatsApp Business Platform (Cloud API)**, so there
is no ban risk and no monthly provider fee — Meta bills per message.

## 1. Create the WhatsApp app at Meta (about 30 minutes)

1. Go to <https://developers.facebook.com/apps> → **Create app** → type
   **Business** → add the **WhatsApp** product.
2. In **WhatsApp → API Setup**, add your business phone number and verify it
   by SMS. Use a number that is **not** active in the WhatsApp app (or follow
   Meta's "use your WhatsApp Business app number" option if offered).
3. Note the **Phone number ID** shown on that page.
4. Create a **permanent access token**: Business Settings → **System users** →
   add a system user (Admin) → **Generate token** for your app with the
   permissions `whatsapp_business_messaging` and `whatsapp_business_management`.
   (The token on the API Setup page expires after 24 hours.)
5. Note the **App secret**: App settings → Basic → App secret.
6. Add a payment method in WhatsApp Manager so messages can be sent.

## 2. Create the message template

WhatsApp Manager → **Message templates** → **Create template**:

- Category: **Utility**
- Name: `confirmation_commande`
- Languages: **French** (add **Arabic** too if you like — see below)
- Body (French):

  ```
  Bonjour {{1}}, merci pour votre commande {{2}} chez Noria 🎉
  Vous avez commandé : {{3}}.
  Total à payer à la livraison : {{4}}.
  Merci de confirmer votre commande pour que nous lancions l'impression.
  ```

- Body (Arabic, optional):

  ```
  مرحبًا {{1}}، شكرًا على طلبك {{2}} من Noria 🎉
  طلبت: {{3}}.
  المبلغ المطلوب عند الاستلام: {{4}}.
  المرجو تأكيد طلبك لنبدأ الطباعة.
  ```

- Buttons → **Quick reply**, in this order:
  1. `Confirmer` (Arabic: `تأكيد`)
  2. `Annuler` (Arabic: `إلغاء`)

Example values for review: `Sara`, `ML-261112-ABCDE`, `1 poster (Casablanca)`, `284 DH`.
Approval usually takes minutes to a day.

## 3. Add the settings in Vercel

Vercel → project **maploom** → Settings → **Environment Variables**
(Production, and Preview if you want to test there). Paste the secrets
there only — never in code or chat.

| Name | Value |
|---|---|
| `WHATSAPP_TOKEN` | the permanent access token (secret) |
| `WHATSAPP_PHONE_NUMBER_ID` | the Phone number ID |
| `WHATSAPP_APP_SECRET` | the App secret (secret) |
| `WHATSAPP_VERIFY_TOKEN` | any long random text you choose, e.g. `noria-7f3k…` |
| `WHATSAPP_TEMPLATE` | `confirmation_commande` (default) |
| `WHATSAPP_TEMPLATE_LANGUAGES` | `fr` or `fr,ar` (the languages you created) |

Redeploy after saving.

## 4. Connect the webhook (so answers come back)

At Meta: **WhatsApp → Configuration → Webhook → Edit**:

- Callback URL: `https://<your-domain>/api/whatsapp/webhook`
- Verify token: the same text as `WHATSAPP_VERIFY_TOKEN`
- Click **Verify and save**, then **subscribe** to the `messages` field.

## 5. Test

Place a test order with your own phone number. You should receive the
message within seconds; tap **Confirmer** and refresh `/admin`: the order
shows *Confirmed* with ✅. In each order's page, the **WhatsApp
confirmation** card shows the status (sent / delivered / read / confirmed /
cancelled / not delivered), lets you **Send again**, and has a **Write
manually** link that opens WhatsApp with a ready message.

## Notes

- Moroccan numbers are recognised in any common form (06…, 07…, +212…, 00212…).
- Customers in Arabic get the Arabic template if `WHATSAPP_TEMPLATE_LANGUAGES`
  includes `ar`; otherwise everyone gets French.
- Without these settings the shop works exactly as before (no messages sent).
- Messages customers send to this number are not shown in the WhatsApp app;
  they are saved in the order history. For a shared inbox, connect a tool such
  as Chatwoot to the same number later.
