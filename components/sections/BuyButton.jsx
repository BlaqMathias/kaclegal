"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * BuyButton — the real Paystack checkout flow for a paid publication.
 *
 * Implements the client half of the publication payment design. The important
 * thing this component deliberately does NOT do is trust its own success
 * state: when Paystack's popup reports a successful charge, that is treated
 * as "go ask the server," not as "the purchase is done." The download page is
 * only ever reached via a token returned by `/api/paystack/verify`, which
 * independently confirms the payment with Paystack before issuing one.
 *
 * State machine: idle -> submitting (calling /initiate) -> the Paystack popup
 * is open (opaque to this component) -> verifying (calling /verify) -> either
 * a router push to /download/[token], or an error state the buyer can retry
 * from.
 *
 * @param {object} props
 * @param {string} props.publicationId
 * @param {string} props.priceLabel - Pre-formatted price, e.g. "\u20a615,000", for the button label.
 */
export default function BuyButton({ publicationId, priceLabel }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | verifying | error
  const [error, setError] = useState("");

  /**
   * Load Paystack's inline Popup script exactly once, however many times
   * this is called across renders or remounts.
   *
   * @returns {Promise<void>}
   */
  function loadPaystackScript() {
    if (window.PaystackPop) {
      return Promise.resolve();
    }

    if (window.__paystackScriptPromise) {
      return window.__paystackScriptPromise;
    }

    window.__paystackScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Could not load the payment popup."));
      document.body.appendChild(script);
    });

    return window.__paystackScriptPromise;
  }

  /**
   * @param {import('react').FormEvent} formEvent
   */
  async function handleSubmit(formEvent) {
    formEvent.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address to continue.");
      return;
    }

    setStatus("submitting");

    try {
      await loadPaystackScript();

      const initiateResponse = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId, buyerEmail: trimmedEmail }),
      });
      const initiateData = await initiateResponse.json().catch(() => null);

      if (!initiateResponse.ok || !initiateData?.ok) {
        setError(
          initiateData?.error ??
            "Could not start this purchase. Please try again.",
        );
        setStatus("error");
        return;
      }

      const { reference, amountKobo, email: verifiedEmail } = initiateData;
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

      if (!publicKey) {
        console.error(
          "[BuyButton] NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set.",
        );
        setError(
          "Payment is not available right now. Please contact us to purchase.",
        );
        setStatus("error");
        return;
      }

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: verifiedEmail,
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        channels: ["card", "bank_transfer", "ussd"],
        onClose: () => {
          fetch("/api/paystack/abandon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference,
              buyerEmail: verifiedEmail,
            }),
            keepalive: true,
          }).catch(() => {});
          setStatus("idle");
        },
        callback: (response) => {
          // A client-side "success" callback — NOT trusted as proof of
          // payment. It only tells us which reference to ask the server to
          // independently verify.
          verifyPayment(response.reference);
        },
      });

      handler.openIframe();
    } catch (caughtError) {
      console.error("[BuyButton] Could not start checkout:", caughtError);
      setError("Could not start this purchase. Please try again.");
      setStatus("error");
    }
  }

  /**
   * @param {string} reference
   */
  async function verifyPayment(reference) {
    setStatus("verifying");

    try {
      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const verifyData = await verifyResponse.json().catch(() => null);

      if (!verifyResponse.ok || !verifyData?.ok) {
        setError(
          verifyData?.error ??
            "We received a payment response but could not confirm it. If you were charged, contact us and we will sort it out.",
        );
        setStatus("error");
        return;
      }

      router.push(`/download/${verifyData.token}`);
    } catch (caughtError) {
      console.error("[BuyButton] Verification request failed:", caughtError);
      setError(
        "We could not confirm your payment just now. If you were charged, contact us and we will sort it out.",
      );
      setStatus("error");
    }
  }

  const isBusy = status === "submitting" || status === "verifying";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        id="buyer-email"
        label="Email address"
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(changeEvent) => setEmail(changeEvent.target.value)}
        disabled={isBusy}
      />

      <Button type="submit" size="lg" fullWidth loading={isBusy}>
        {status === "verifying"
          ? "Confirming payment\u2026"
          : `Buy \u2014 ${priceLabel}`}
      </Button>

      {error && (
        <p role="alert" className="text-caption text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
