import { getPracticeArea } from "@/content/practice-areas";
import { sendConsultationNotification } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Consultation form endpoint.
 *
 * The Supabase and Resend SDKs need the Node.js runtime (not the Edge runtime).
 */
export const runtime = "nodejs";

/** Basic, pragmatic email shape check (full RFC validation is not worthwhile here). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field length caps — light abuse guard, applied server-side. */
const MAX = { name: 200, email: 320, phone: 60, message: 5000 };

/**
 * Resolve the submitted practice-area value into a canonical slug, a
 * human-readable label, and a suggested contact.
 *
 * The suggested contact is derived from the SAME source of truth as the rest of
 * the site — the `lawyers` array on each practice-area content file (Phase 3/4)
 * — so there is no duplicated mapping to drift out of sync. Family Law has no
 * assigned lawyer yet, and the neutral "general" option has none by design; in
 * both cases the suggested contact is left empty.
 *
 * @param {string} value - Raw `practiceArea` value from the request.
 * @returns {{ slug: string, label: string, suggestedContact: string }}
 */
function resolvePracticeArea(value) {
  if (!value || value === "general") {
    return { slug: "general", label: "General inquiry", suggestedContact: "" };
  }
  const area = getPracticeArea(value);
  if (!area) {
    // Unknown slug — be lenient but safe: treat as a general inquiry.
    return { slug: "general", label: "General inquiry", suggestedContact: "" };
  }
  return {
    slug: area.slug,
    label: area.title,
    suggestedContact: Array.isArray(area.lawyers)
      ? area.lawyers.join(", ")
      : "",
  };
}

/**
 * Coerce an unknown value to a trimmed string, capped at `max` characters.
 *
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
function str(value, max) {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * POST /api/contact — validate, persist to Supabase, and email the shared inbox.
 *
 * Behaviour:
 *  1. Parse + validate server-side (never trust the client alone).
 *  2. Honeypot: if the hidden `company` field is filled, return a generic
 *     success without processing (don't tip off bots).
 *  3. Insert a permanent record into `consultation_requests`.
 *  4. Email a notification whose subject names the suggested contact.
 *  5/6. DB and email run in independent try/catch blocks: one failing must not
 *     prevent the other, and each failure is logged server-side. The request is
 *     reported successful to the user if EITHER channel captured it.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const name = str(body?.name, MAX.name);
  const email = str(body?.email, MAX.email);
  const phone = str(body?.phone, MAX.phone);
  const practiceAreaRaw = str(body?.practiceArea, 100);
  const message = str(body?.message, MAX.message);
  const honeypot = str(body?.company, 200);

  // 2. Honeypot filled → silently accept, do no work.
  if (honeypot) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 1. Validation.
  /** @type {Record<string, string>} */
  const fieldErrors = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!email) fieldErrors.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(email))
    fieldErrors.email = "Please enter a valid email address.";
  if (!practiceAreaRaw)
    fieldErrors.practiceArea = "Please select a practice area.";
  if (!message) fieldErrors.message = "Please enter a message.";

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please check the highlighted fields and try again.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const { slug, label, suggestedContact } =
    resolvePracticeArea(practiceAreaRaw);

  let dbOk = false;
  let emailOk = false;

  // 3. Persist a permanent record.
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("consultation_requests").insert({
      name,
      email,
      phone: phone || null,
      practice_area: slug,
      message,
    });
    if (error) throw error;
    dbOk = true;
  } catch (err) {
    console.error("[contact] Supabase insert failed:", err?.message || err);
  }

  // 4. Notify the shared inbox (with the suggested-contact subject line).
  try {
    await sendConsultationNotification({
      name,
      email,
      phone,
      practiceAreaLabel: label,
      suggestedContact,
      message,
    });
    emailOk = true;
  } catch (err) {
    console.error("[contact] Email notification failed:", err?.message || err);
  }

  // 5. Success if the request was captured by at least one channel.
  if (dbOk || emailOk) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Something went wrong on our end. Please try again, or contact us directly by email or phone.",
    },
    { status: 502 },
  );
}
