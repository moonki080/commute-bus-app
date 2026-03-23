import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          width="180"
          height="180"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(52 40) rotate(52.3) scale(170)">
              <stop stopColor="#38BDF8" />
              <stop offset="0.42" stopColor="#0F172A" />
              <stop offset="1" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="plate" x1="32" y1="28" x2="148" y2="152" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.2)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            <linearGradient id="busBody" x1="63" y1="57" x2="63" y2="114" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.55" stopColor="#DBE8F6" />
              <stop offset="1" stopColor="#BED1E5" />
            </linearGradient>
            <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#A5F3FC" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          <rect width="180" height="180" rx="44" fill="url(#bg)" />
          <rect x="20" y="20" width="140" height="140" rx="38" fill="url(#plate)" />
          <rect x="28" y="28" width="124" height="124" rx="34" fill="rgba(56,189,248,0.08)" />

          <rect x="47" y="64" width="86" height="44" rx="12" fill="url(#busBody)" />
          <rect x="61" y="52" width="40" height="14" rx="6" fill="#EAF3FD" />
          <rect x="58" y="70" width="17" height="15" rx="4" fill="url(#window)" />
          <rect x="79" y="70" width="17" height="15" rx="4" fill="url(#window)" />
          <rect x="100" y="70" width="17" height="15" rx="4" fill="url(#window)" />
          <rect x="55" y="94" width="64" height="5" rx="2.5" fill="#2563EB" />
          <circle cx="70" cy="118" r="11" fill="#0F172A" />
          <circle cx="70" cy="118" r="4" fill="#CBD5E1" />
          <circle cx="110" cy="118" r="11" fill="#0F172A" />
          <circle cx="110" cy="118" r="4" fill="#CBD5E1" />
        </svg>
      </div>
    ),
    size,
  );
}
