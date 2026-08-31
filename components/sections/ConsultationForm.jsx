'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/**
 * Practice-area dropdown options. Values are the exact Phase 3 slugs so they
 * round-trip through the `?practiceArea=` query param and the API's
 * suggested-contact lookup. The trailing "general" option is the neutral
 * "Not sure" choice.
 */
const PRACTICE_AREA_OPTIONS = [
  { value: 'company-secretarial', label: 'Company Secretarial & Legal Advisory Services' },
  { value: 'data-privacy', label: 'Data Privacy and Protection' },
  { value: 'regulatory-compliance', label: 'Regulatory Compliance' },
  { value: 'intellectual-property', label: 'Intellectual Property' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'family-law', label: 'Family Law' },
  { value: 'general', label: 'Not sure / General inquiry' },
];

const VALID_AREA_VALUES = new Set(PRACTICE_AREA_OPTIONS.map((o) => o.value));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = { name: '', email: '', phone: '', practiceArea: '', message: '', company: '' };

/**
 * Client-side validation mirroring the server rules. Returns a map of
 * field -> message (empty object means valid).
 *
 * @param {typeof EMPTY} v
 * @returns {Record<string, string>}
 */
function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.';
  if (!v.practiceArea) e.practiceArea = 'Please select a practice area.';
  if (!v.message.trim()) e.message = 'Please enter a message.';
  return e;
}

/**
 * ConsultationForm — the contact/consultation form.
 *
 * Controlled inputs, client-side validation (re-checked server-side), a hidden
 * honeypot field for bot defence, and four UX states: idle, submitting,
 * success, and error. On load it reads `?practiceArea=<slug>` and pre-selects
 * the matching option.
 *
 * Uses `useSearchParams`, so it must be rendered inside a <Suspense> boundary
 * (handled by the contact page).
 */
export default function ConsultationForm() {
  const searchParams = useSearchParams();
  const paramArea = searchParams.get('practiceArea');
  const initialArea = paramArea && VALID_AREA_VALUES.has(paramArea) ? paramArea : '';

  const [values, setValues] = useState({ ...EMPTY, practiceArea: initialArea });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [serverError, setServerError] = useState('');

  /** Update one field and clear its inline error as the user edits. */
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      setServerError('');
      return;
    }

    setStatus('submitting');
    setServerError('');
    setErrors({});

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setValues({ ...EMPTY });
        setStatus('success');
        return;
      }

      if (data.fieldErrors) setErrors(data.fieldErrors);
      setStatus('error');
      setServerError(
        data.error || 'Something went wrong. Please try again, or reach us directly by email or phone.'
      );
    } catch {
      setStatus('error');
      setServerError(
        'We could not send your message just now. Please try again, or reach us directly by email or phone.'
      );
    }
  }

  const isSubmitting = status === 'submitting';

  const textareaClasses = [
    'w-full rounded-none border bg-white px-3.5 py-2.5 text-body text-brand-slate',
    'placeholder:text-brand-muted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
    errors.message
      ? 'border-brand-error focus:border-brand-error focus:ring-brand-error/40'
      : 'border-slate-300 focus:border-brand-navy focus:ring-brand-navy/30',
  ].join(' ');

  // Success state replaces the form entirely.
  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-none border border-brand-teal/30 bg-brand-teal/5 p-8 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/15">
          <svg className="h-6 w-6 text-brand-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-h4 text-brand-navy">Thank you — your message is on its way.</h3>
        <p className="mt-2 text-body text-brand-muted">
          We&rsquo;ll be in touch within 1&ndash;2 business days.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status === 'error' && serverError && (
        <div
          role="alert"
          className="rounded-none border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-body text-brand-error"
        >
          {serverError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Name"
          name="name"
          required
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Optional"
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
        />
        <Select
          label="Practice Area"
          id="practiceArea"
          name="practiceArea"
          required
          value={values.practiceArea}
          onChange={handleChange}
          error={errors.practiceArea}
        >
          <option value="" disabled>
            Select a practice area
          </option>
          {PRACTICE_AREA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full">
        <label htmlFor="message" className="mb-1.5 block text-caption font-medium text-brand-slate">
          Message
          <span className="ml-0.5 text-brand-error">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={values.message}
          onChange={handleChange}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className={textareaClasses}
          placeholder="Tell us a little about your business or the matter you need help with."
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-caption text-brand-error">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from real users; bots that fill it are silently rejected. */}
      <div className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave this field empty)</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={handleChange}
        />
      </div>

      <div className="pt-1">
        <Button type="submit" size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send Message'}
        </Button>
        <p className="mt-3 text-caption text-brand-muted">
          We typically respond within 1&ndash;2 business days.
        </p>
      </div>
    </form>
  );
}
