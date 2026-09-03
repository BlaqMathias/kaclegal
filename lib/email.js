import { Resend } from "resend";

/**
 * Transactional email helper (Resend).
 *
 * Server-only: uses RESEND_API_KEY, which must never reach the browser. The
 * client is created lazily so a missing key surfaces as a clear runtime error
 * in the request handler rather than at build time.
 */

/** @type {import('resend').Resend | null} */
let cachedResend = null;

/**
 * Get (and memoise) the Resend client.
 *
 * @returns {import('resend').Resend}
 * @throws {Error} If RESEND_API_KEY is not set.
 */
function getResend() {
  if (cachedResend) {
    return cachedResend;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY in your environment.",
    );
  }
  cachedResend = new Resend(apiKey);
  return cachedResend;
}

/**
 * Escape a string for safe interpolation into HTML, preventing markup/script
 * injection from user-supplied values in the notification email body.
 *
 * @param {unknown} value - Raw value (coerced to string).
 * @returns {string} HTML-safe text.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Collapse newlines and control characters out of a single-line header value
 * (e.g. the subject), preventing email header injection.
 *
 * @param {unknown} value - Raw value (coerced to string).
 * @returns {string} A safe single-line string.
 */
function sanitizeHeader(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

/**
 * @typedef {object} ConsultationNotification
 * @property {string} name - Submitter's name.
 * @property {string} email - Submitter's email (used as reply-to).
 * @property {string} [phone] - Optional phone number.
 * @property {string} practiceAreaLabel - Human-readable practice area (or "General inquiry").
 * @property {string} [suggestedContact] - Suggested lawyer(s) to pick this up; omitted from the subject if empty.
 * @property {string} message - The enquiry message.
 */

/**
 * Send the consultation-request notification to the firm's shared inbox.
 *
 * The practice-area selection drives a "suggested contact" that is surfaced in
 * both the subject line and the body, so whoever monitors the shared inbox
 * knows who should pick the matter up (see the shared-inbox limitation noted in
 * the API route). All user-supplied values are HTML-escaped in the body and the
 * subject is stripped of newlines before sending.
 *
 * @param {ConsultationNotification} details
 * @returns {Promise<{ id: string | null }>} The Resend message id (or null).
 * @throws {Error} If sending fails or email is not configured.
 */
export async function sendConsultationNotification(details) {
  const { name, email, phone, practiceAreaLabel, suggestedContact, message } =
    details;

  const resend = getResend();

  const toInbox =
    process.env.CONTACT_INBOX_EMAIL || "info@kaclegalpractice.com";

  const rawFrom = process.env.EMAIL_FROM;
  const from = rawFrom
    ? rawFrom.includes("<")
      ? rawFrom
      : `Koko Asuquo Chambers <${rawFrom}>`
    : "Koko Asuquo Chambers <onboarding@resend.dev>";

  const contactSuffix = suggestedContact
    ? ` (suggested contact: ${suggestedContact})`
    : "";
  const subject = sanitizeHeader(
    `New Consultation Request — ${practiceAreaLabel}${contactSuffix}`,
  );

  const phoneDisplay = phone && phone.trim() ? phone : "Not provided";
  const suggestedDisplay =
    suggestedContact || "No assigned lawyer — route via the shared inbox";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #2B2F36; line-height: 1.6;">
      <h2 style="color: #04509F; margin-bottom: 4px;">New Consultation Request</h2>
      <p style="margin-top: 0; color: #6B7280;">
        Practice area: <strong>${escapeHtml(practiceAreaLabel)}</strong><br />
        Suggested contact: <strong>${escapeHtml(suggestedDisplay)}</strong>
      </p>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #6B7280; vertical-align: top;">Name</td>
          <td style="padding: 4px 0;"><strong>${escapeHtml(name)}</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #6B7280; vertical-align: top;">Email</td>
          <td style="padding: 4px 0;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 16px 4px 0; color: #6B7280; vertical-align: top;">Phone</td>
          <td style="padding: 4px 0;">${escapeHtml(phoneDisplay)}</td>
        </tr>
      </table>
      <h3 style="color: #04509F; margin-bottom: 4px; margin-top: 24px;">Message</h3>
      <p style="white-space: pre-wrap; margin-top: 0;">${escapeHtml(message)}</p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #6B7280; font-size: 13px;">
        Sent from the KACLegal.com consultation form. Reply directly to this email to respond to ${escapeHtml(name)}.
      </p>
    </div>
  `;

  const text = [
    "New Consultation Request",
    `Practice area: ${practiceAreaLabel}`,
    `Suggested contact: ${suggestedDisplay}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phoneDisplay}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from,
    to: [toInbox],
    replyTo: email,
    subject,
    html,
    text,
  });

  if (error) {
    // Surface as a thrown error so the caller's try/catch logs and handles it.
    throw new Error(`Resend send failed: ${error.message || "unknown error"}`);
  }

  return { id: data?.id ?? null };
}

/**
 * @typedef {object} PurchaseConfirmation
 * @property {string} buyerEmail - Where to send the confirmation.
 * @property {string} publicationTitle - The purchased publication's title.
 * @property {string} downloadUrl - Full URL to the `/download/[token]` page.
 * @property {string} expiresAt - ISO timestamp of when the link expires.
 * @property {number} downloadsRemaining - How many downloads the link allows.
 */

/**
 * Send the buyer their download link by email, immediately after a purchase
 * is confirmed.
 *
 * This exists specifically to cover the case the webhook was built for: a
 * buyer who closes their browser right after paying, before the client-side
 * redirect to `/download/[token]` happens, would otherwise have no way of
 * ever finding their download link — the webhook still creates it
 * server-side, but nothing pointed the buyer to it. Called from whichever of
 * `/api/paystack/verify` or `/api/paystack/webhook` actually creates the
 * token (see `justCreated` on `getOrCreateDownloadToken`'s return value) —
 * calling it from both unconditionally would send the buyer two copies.
 *
 * A failure here is logged but deliberately does not fail the purchase
 * itself — the download link still works even if this email never arrives.
 *
 * @param {PurchaseConfirmation} details
 * @returns {Promise<{ id: string | null }>}
 * @throws {Error} If sending fails or email is not configured.
 */
export async function sendPurchaseConfirmation(details) {
  const {
    buyerEmail,
    publicationTitle,
    downloadUrl,
    expiresAt,
    downloadsRemaining,
  } = details;

  const resend = getResend();

  const rawFrom = process.env.EMAIL_FROM;
  const from = rawFrom
    ? rawFrom.includes("<")
      ? rawFrom
      : `Koko Asuquo Chambers <${rawFrom}>`
    : "Koko Asuquo Chambers <onboarding@resend.dev>";

  const subject = sanitizeHeader(`Your download: ${publicationTitle}`);

  const expiryDisplay = new Date(expiresAt).toUTCString();
  const downloadsLabel = `${downloadsRemaining} download${downloadsRemaining === 1 ? "" : "s"}`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #2B2F36; line-height: 1.6;">
      <h2 style="color: #04509F; margin-bottom: 4px;">Thank you for your purchase</h2>
      <p style="margin-top: 0; color: #6B7280;">
        Your copy of <strong>${escapeHtml(publicationTitle)}</strong> is ready to download.
      </p>
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(downloadUrl)}" style="background-color: #04509F; color: #FFFFFF; padding: 12px 24px; text-decoration: none; display: inline-block;">
          Download your file
        </a>
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        This link allows ${downloadsLabel} and expires ${escapeHtml(expiryDisplay)}.
        If it stops working before you've downloaded your file, reply to this
        email and we'll send you a new one at no extra cost.
      </p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
      <p style="color: #6B7280; font-size: 13px;">
        Sent from KACLegal.com following your purchase.
      </p>
    </div>
  `;

  const text = [
    "Thank you for your purchase",
    `Your copy of ${publicationTitle} is ready to download.`,
    "",
    `Download: ${downloadUrl}`,
    "",
    `This link allows ${downloadsLabel} and expires ${expiryDisplay}.`,
    "If it stops working before you've downloaded your file, reply to this email and we'll send you a new one at no extra cost.",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from,
    to: [buyerEmail],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message || "unknown error"}`);
  }

  return { id: data?.id ?? null };
}
