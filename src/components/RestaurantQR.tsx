"use client";

import { useState } from "react";

interface Props {
  qrDataUrl: string;
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

  const initials = restaurantName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="card-shadow rounded-[var(--radius-card)] bg-white overflow-hidden">
      {/* Brand header bar */}
      <div className="bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{restaurantName}</p>
          <p className="text-white/70 text-xs mt-0.5">Powered by Tiffino</p>
        </div>
        <div className="ml-auto">
          <span className="bg-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            MEAL QR
          </span>
        </div>
      </div>

      {/* QR card body */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs text-[var(--color-text-muted)] text-center mb-5">
          Students scan this QR daily to consume their meal token
        </p>

        {/* QR frame */}
        <div className="flex justify-center mb-5">
          <div className="relative p-1 rounded-2xl bg-white"
            style={{ boxShadow: "0 0 0 3px var(--color-brand-primary), 0 4px 20px rgba(226,55,68,0.18)" }}>
            {/* Corner decorators */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-[3px] border-l-[3px] border-[var(--color-brand-primary)] rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-[3px] border-r-[3px] border-[var(--color-brand-primary)] rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-[3px] border-l-[3px] border-[var(--color-brand-primary)] rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-[3px] border-r-[3px] border-[var(--color-brand-primary)] rounded-br-lg" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Restaurant meal QR code"
              width={200}
              height={200}
              className="rounded-xl block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </div>

        {/* Label below QR */}
        <div className="text-center mb-5">
          <p className="text-base font-bold text-[var(--color-text-primary)]">Scan to mark your meal</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">One scan per slot per day · server-verified</p>
        </div>

        {/* Info pills */}
        <div className="flex justify-center gap-2 flex-wrap mb-5">
          {["Static & permanent", "Secure", "No expiry"].map((t) => (
            <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
              ✓ {t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={download} className="btn-primary flex-1 py-2.5 text-sm rounded-xl flex items-center gap-2 justify-center">
            ⬇ Download PNG
          </button>
          <button onClick={copyDataUrl} className="btn-ghost flex-1 py-2.5 text-sm rounded-xl">
            {copied ? "✓ Copied!" : "Copy image"}
          </button>
        </div>
      </div>
    </div>
  );
}
