'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function PurchaseRecoveryForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/publications/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerEmail: email.trim(),
          reference: reference.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Could not recover this purchase.');
        setBusy(false);
        return;
      }

      router.push(`/download/${payload.token}`);
    } catch (caught) {
      console.error('[PurchaseRecoveryForm] Recovery failed:', caught);
      setError('Could not reach the server. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Input
        id="recovery-email"
        type="email"
        label="Purchase email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={busy}
        placeholder="you@example.com"
      />

      <Input
        id="recovery-reference"
        label="Payment reference"
        required
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        disabled={busy}
        placeholder="kac_..."
      />

      <Button type="submit" fullWidth loading={busy}>
        Recover purchase
      </Button>

      {error && (
        <p role="alert" className="text-caption text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
