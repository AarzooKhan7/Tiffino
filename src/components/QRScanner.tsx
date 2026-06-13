"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (token: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !divRef.current) return;

        const scanner = new Html5Qrcode("qr-scanner-div");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            void scanner.stop().catch(() => {});
            if (mounted) onScan(decodedText.trim());
          },
          () => { /* ignore non-match frames */ }
        );
      } catch (e) {
        if (mounted) {
          setError("Camera unavailable — enter the QR token manually.");
          setShowManual(true);
        }
      }
    }

    void startScanner();

    return () => {
      mounted = false;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) void s.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Scan Tiffino QR</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Point your camera at the mess QR code</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors">
            ✕
          </button>
        </div>

        {/* Camera view */}
        {!showManual && (
          <div className="relative mx-5 rounded-xl overflow-hidden bg-black" style={{ height: 260 }}>
            <div id="qr-scanner-div" ref={divRef} className="w-full h-full" />
            {/* Viewfinder corners */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48">
                {[
                  "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-[var(--color-brand-primary)] ${cls}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mx-5 mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Manual fallback */}
        <div className="px-5 pb-5 mt-4">
          {showManual ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">Enter QR token manually</label>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste or type token"
                className="input-base w-full"
              />
              <button
                onClick={() => { if (manualToken.trim()) onScan(manualToken.trim()); }}
                disabled={!manualToken.trim()}
                className="btn-primary w-full py-3 rounded-xl text-sm">
                Submit token
              </button>
            </div>
          ) : (
            <button onClick={() => setShowManual(true)}
              className="w-full text-xs text-[var(--color-text-muted)] hover:underline text-center">
              Can&apos;t scan? Enter token manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
