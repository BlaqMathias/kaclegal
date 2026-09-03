'use client';

import { useState } from 'react';

function filenameFromDisposition(value, fallback) {
  if (!value) return fallback;

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(value);
  return plain?.[1] || fallback;
}

export default function PaidDownloadButton({
  token,
  fallbackFilename = 'publication',
}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleDownload() {
    if (status === 'loading') return;

    setStatus('loading');
    setError('');

    try {
      const response = await fetch(
        `/api/download/${encodeURIComponent(token)}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      // An invalid/expired token redirects back to its page. fetch() follows
      // that redirect, so `redirected` is checked in addition to the status.
      if (!response.ok || response.redirected) {
        throw new Error('This download is no longer available.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(
        response.headers.get('content-disposition'),
        fallbackFilename,
      );
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      // Browsers do not expose a reliable "finished writing to disk" event.
      // At this point every byte has loaded into the browser and the native
      // download has been triggered, which is the safe redirect boundary.
      window.setTimeout(() => {
        window.location.assign('/publications');
      }, 250);
    } catch (caught) {
      console.error('[PaidDownloadButton] Download failed:', caught);
      setError(
        caught?.message || 'Could not download the file. Please try again.',
      );
      setStatus('error');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-brand-navy px-7 py-3 text-body font-medium text-white transition-colors duration-200 hover:bg-brand-navyDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Preparing download…' : 'Download your file'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-caption text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
