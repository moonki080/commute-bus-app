import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
        }}
      >
        <svg
          width="512"
          height="512"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(148 114) rotate(52.3) scale(484.032)">
              <stop stopColor="#38BDF8" />
              <stop offset="0.42" stopColor="#0F172A" />
              <stop offset="1" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="plate" x1="91" y1="84" x2="421" y2="436" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.2)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            <linearGradient id="busBody" x1="178" y1="162" x2="178" y2="326" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.55" stopColor="#DBE8F6" />
              <stop offset="1" stopColor="#BED1E5" />
            </linearGradient>
            <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#A5F3FC" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <radialGradient id="wheel" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0.35 0.35) scale(0.9)">
              <stop stopColor="#334155" />
              <stop offset="0.45" stopColor="#0F172A" />
              <stop offset="1" stopColor="#020617" />
            </radialGradient>
            <radialGradient id="hub" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0.35 0.35) scale(0.9)">
              <stop stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#94A3B8" />
            </radialGradient>
          </defs>

          <rect width="512" height="512" rx="124" fill="url(#bg)" />
          <rect x="58" y="58" width="396" height="396" rx="108" fill="url(#plate)" />
          <rect x="78" y="78" width="356" height="356" rx="96" fill="rgba(56,189,248,0.08)" />

          <g>
            <rect x="134" y="182" width="244" height="128" rx="30" fill="url(#busBody)" />
            <rect x="176" y="146" width="112" height="40" rx="18" fill="#EAF3FD" />
            <rect x="168" y="200" width="48" height="44" rx="10" fill="url(#window)" />
            <rect x="226" y="200" width="48" height="44" rx="10" fill="url(#window)" />
            <rect x="284" y="200" width="48" height="44" rx="10" fill="url(#window)" />
            <rect x="156" y="268" width="184" height="14" rx="7" fill="#2563EB" />
            <rect x="334" y="224" width="20" height="54" rx="10" fill="#1E40AF" />
          </g>

          <g>
            <circle cx="198" cy="340" r="34" fill="url(#wheel)" />
            <circle cx="198" cy="340" r="12" fill="url(#hub)" />
            <circle cx="314" cy="340" r="34" fill="url(#wheel)" />
            <circle cx="314" cy="340" r="12" fill="url(#hub)" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
