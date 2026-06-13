"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  qrDataUrl: string; // base64 data URL from server
  restaurantName: string;
}

export default function RestaurantQR({ qrDataUrl, restaurantName }: Props) {
  const [copied, setCopied] = useState(false);

  function download() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${restaurantName.replace(/\s+/g, "_")}_tiffino_qr.png`;
    a.click();
  }

  function copyDataUrl() {
    void navigator.clipboard.writeText(qrDataUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card-shadow rounded-[var(--radius-card)] bg-white px-6 py-5">
      <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Your Tiffino QR Code</h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Print and display this at your mess entrance. Students scan it daily to consume their meal token.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* QR image */}
        <div className="rounded-xl border-4 border-[var(--color-brand-primary)] p-2 bg-white shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Restaurant QR code" width={180} height={180} />
        </div>

        <div className="space-y-3 flex-1 w-full">
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
            <p className="text-xs font-semibold text-orange-700 mb-1">How it works</p>
            <ul className="text-xs text-orange-600 space-y-0.5 list-disc list-inside">
              <li>One QR code per restaurant — static &amp; permanent</li>
              <li>Each student can scan once per slot per day</li>
              <li>Server verifies the code matches their subscription</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={download}
              className="btn-primary py-2.5 text-sm rounded-xl flex items-center gap-2 justify-center">
              ⬇ Download QR PNG
            </button>
            <button onClick={copyDataUrl}
              className="btn-ghost py-2.5 text-sm rounded-xl border border-[var(--color-border)]">
              {copied ? "✓ Copied!" : "Copy image data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
