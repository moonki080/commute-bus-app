"use client";

import Image from "next/image";
import { useState } from "react";

const PUBLIC_DATA_API_LOGO_SRC = "/logos/public-data-api-logo.png";

export function SourceFooter() {
  const [showLogo, setShowLogo] = useState(true);

  return (
    <footer className="pt-3">
      <div className="glass-panel flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-slate-400">
        <div className="flex min-w-0 items-center gap-3">
          {showLogo ? (
            <Image
              src={PUBLIC_DATA_API_LOGO_SRC}
              alt="공공데이터포털 OpenAPI 로고"
              width={132}
              height={24}
              unoptimized
              className="h-6 w-auto shrink-0 object-contain opacity-85"
              onError={() => setShowLogo(false)}
            />
          ) : (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200">
              공공데이터 API
            </span>
          )}
          <p className="truncate">공공데이터포털 OpenAPI 제공</p>
        </div>
      </div>
    </footer>
  );
}
