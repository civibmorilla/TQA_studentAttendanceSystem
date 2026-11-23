import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Camera QR scanner.
 * - onScan(text) fires once per distinct code; the same code is ignored for `cooldownMs`
 *   so one QR held in front of the camera isn't submitted 30 times a second.
 * - Camera access needs HTTPS (or localhost). On plain http over LAN the browser blocks it,
 *   so we show a clear message and the parent page offers manual code entry.
 */
export default function QrScanner({ onScan, paused = false, cooldownMs = 3000 }) {
  const reactId = useId();
  const elementId = `qr-reader-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const scannerRef = useRef(null);
  const lastRef = useRef({ text: '', at: 0 });
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;
  const [error, setError] = useState(
    insecure ? 'Camera needs a secure (https) connection. Use the manual code entry instead, or open the site over https / localhost.' : ''
  );
  const [starting, setStarting] = useState(!insecure);

  useEffect(() => {
    onScanRef.current = onScan;
    pausedRef.current = paused;
  }, [onScan, paused]);

  useEffect(() => {
    if (insecure) return undefined;
    let cancelled = false;
    const scanner = new Html5Qrcode(elementId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s }; } },
        (text) => {
          if (pausedRef.current) return;
          const now = Date.now();
          if (text === lastRef.current.text && now - lastRef.current.at < cooldownMs) return;
          lastRef.current = { text, at: now };
          onScanRef.current?.(text);
        },
        () => {} // per-frame "no QR found" — ignore
      )
      .then(() => { if (!cancelled) setStarting(false); })
      .catch((err) => {
        if (cancelled) return;
        const msg = String(err?.message || err);
        setError(
          /permission|NotAllowed/i.test(msg)
            ? 'Camera permission was denied. Allow camera access in your browser settings, or type the code manually.'
            : /NotFound|no camera|Requested device not found/i.test(msg)
              ? 'No camera was found on this device. Type the code manually instead.'
              : `Could not start the camera: ${msg}`
        );
        setStarting(false);
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.isScanning) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
  }, [elementId, cooldownMs, insecure]);

  return (
    <div className="w-full">
      <div
        id={elementId}
        className={`w-full overflow-hidden rounded-xl bg-slate-900 ${error ? 'hidden' : ''}`}
        style={{ minHeight: 260 }}
      />
      {starting && !error && (
        <p className="text-xs text-slate-400 text-center mt-2">Starting camera…</p>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
          📷 {error}
        </div>
      )}
    </div>
  );
}
