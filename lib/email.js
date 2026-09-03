import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

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
 * Send a purchase receipt without a download token/link. The payment reference
 * is the buyer's recovery key if they later need to regain access on the site.
 */
export async function sendPurchaseReceipt({
  buyerEmail,
  publicationTitle,
  amountNaira,
  reference,
  purchasedAt,
}) {
  const resend = getResend();

  const rawFrom = process.env.EMAIL_FROM;
  const from = rawFrom
    ? rawFrom.includes("<")
      ? rawFrom
      : `Koko Asuquo Chambers <${rawFrom}>`
    : "Koko Asuquo Chambers <onboarding@resend.dev>";

  const subject = sanitizeHeader(`Payment receipt: ${publicationTitle}`);
  const amount = `₦${Number(amountNaira || 0).toLocaleString("en-US")}`;
  const date = new Date(purchasedAt || Date.now()).toUTCString();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #2B2F36; line-height: 1.6;">
      <h2 style="color: #04509F; margin-bottom: 4px;">Payment confirmed</h2>
      <p style="margin-top: 0; color: #6B7280;">
        Thank you for purchasing <strong>${escapeHtml(publicationTitle)}</strong>.
      </p>
      <table style="border-collapse: collapse; margin-top: 20px;">
        <tr><td style="padding: 4px 16px 4px 0; color: #6B7280;">Amount</td><td>${escapeHtml(amount)}</td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #6B7280;">Reference</td><td><strong>${escapeHtml(reference)}</strong></td></tr>
        <tr><td style="padding: 4px 16px 4px 0; color: #6B7280;">Confirmed</td><td>${escapeHtml(date)}</td></tr>
      </table>
      <p style="margin-top: 20px; color: #6B7280; font-size: 13px;">
        No download link is included in this email. If you need to recover access
        later, use your email address and the payment reference above on the KAC
        Legal Publications recovery page.
      </p>
    </div>
  `;

  const text = [
    "Payment confirmed",
    `Publication: ${publicationTitle}`,
    `Amount: ${amount}`,
    `Reference: ${reference}`,
    `Confirmed: ${date}`,
    "",
    "No download link is included in this email. Use your email address and this payment reference on the KAC Legal Publications recovery page if you need to recover access later.",
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

/**
 * Race-safe, retryable receipt delivery. Both Paystack verify and the webhook
 * call this after completion; an atomic database claim allows only one sender
 * through at a time. Failed sends release the claim for a later retry.
 */
export async function sendPurchaseReceiptOnce(details) {
  const supabase = getSupabaseAdmin();
  const reference = String(details?.reference ?? "").trim();
  if (!reference) return { sent: false };

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_purchase_receipt",
    { p_reference: reference },
  );

  if (claimError) {
    throw new Error(
      `Could not claim purchase receipt: ${claimError.message || "unknown error"}`,
    );
  }

  if (!claimed) return { sent: false };

  try {
    const result = await sendPurchaseReceipt(details);
    const now = new Date().toISOString();

    const { error: markError } = await supabase
      .from("transactions")
      .update({
        receipt_sent_at: now,
        receipt_claimed_at: null,
        updated_at: now,
      })
      .eq("reference", reference);

    if (markError) {
      console.error("[email] Receipt sent but could not mark it sent:", markError);
    }

    return { sent: true, id: result.id };
  } catch (error) {
    const { error: releaseError } = await supabase
      .from("transactions")
      .update({
        receipt_claimed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference)
      .is("receipt_sent_at", null);

    if (releaseError) {
      console.error("[email] Could not release failed receipt claim:", releaseError);
    }

    throw error;
  }
}
