import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ value, size = 180 }) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border-2 border-border bg-white p-3 shadow-md">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#1a1a2e"
          level="M"
          marginSize={3}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[240px] break-all">{value}</p>
    </div>
  );
}
