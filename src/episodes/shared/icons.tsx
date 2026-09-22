// Small, consistent flat-vector icon set used across scenes. Kept generic
// and brand-free (no real logos) per the episode's constraints.

export const PersonIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 60,
  color = "#8892B0",
}) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 60 96">
    <circle cx="30" cy="18" r="16" fill={color} />
    <path d="M6 96 Q6 50 30 50 Q54 50 54 96 Z" fill={color} />
  </svg>
);

export const PhoneIcon: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  glow?: string;
}> = ({ width = 130, height = 260, color = "#161D36", glow = "#F7931A" }) => (
  <svg width={width} height={height} viewBox="0 0 130 260">
    <rect
      x="6"
      y="6"
      width="118"
      height="248"
      rx="22"
      fill={color}
      stroke="#2A3560"
      strokeWidth="4"
    />
    <rect x="16" y="30" width="98" height="176" rx="4" fill={glow} opacity="0.18" />
    <rect x="16" y="30" width="98" height="176" rx="4" fill="none" stroke={glow} strokeWidth="2" opacity="0.5" />
    <circle cx="65" cy="230" r="10" fill="#2A3560" />
  </svg>
);

export const PizzaSliceIcon: React.FC<{ size?: number }> = ({
  size = 90,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      d="M50 8 L92 88 Q50 104 8 88 Z"
      fill="#F5C518"
      stroke="#B8860B"
      strokeWidth="3"
    />
    <circle cx="50" cy="45" r="6" fill="#E23B3B" />
    <circle cx="34" cy="62" r="5" fill="#E23B3B" />
    <circle cx="66" cy="62" r="5" fill="#E23B3B" />
    <circle cx="50" cy="78" r="5" fill="#E23B3B" />
  </svg>
);

export const BitcoinCoin: React.FC<{ size?: number; rotateDeg?: number }> = ({
  size = 160,
  rotateDeg = 0,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ transform: `rotateY(${rotateDeg}deg)` }}
  >
    <circle cx="50" cy="50" r="46" fill="#F7931A" stroke="#C97612" strokeWidth="4" />
    <text
      x="50"
      y="68"
      textAnchor="middle"
      fontSize="56"
      fontWeight="900"
      fontFamily="Georgia, serif"
      fill="#FFFFFF"
    >
      ₿
    </text>
  </svg>
);

export const CarIcon: React.FC<{ width?: number; height?: number }> = ({
  width = 220,
  height = 100,
}) => (
  <svg width={width} height={height} viewBox="0 0 220 100">
    <path
      d="M18 68 Q22 34 60 30 L86 30 Q100 30 108 42 L168 46 Q198 48 202 68 L202 76 L18 76 Z"
      fill="#E23B3B"
      stroke="#8C1F1F"
      strokeWidth="3"
    />
    <path d="M92 34 L104 34 Q116 34 122 46 L92 46 Z" fill="#0A0E1A" opacity="0.75" />
    <circle cx="58" cy="78" r="15" fill="#161D36" stroke="#8892B0" strokeWidth="3" />
    <circle cx="164" cy="78" r="15" fill="#161D36" stroke="#8892B0" strokeWidth="3" />
  </svg>
);

export const TrainCoachIcon: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  chained?: boolean;
}> = ({ width = 140, height = 110, color = "#F7931A" }) => (
  <svg width={width} height={height} viewBox="0 0 140 110">
    <rect x="10" y="16" width="120" height="66" rx="10" fill={color} stroke="#0A0E1A" strokeWidth="3" />
    <rect x="24" y="30" width="30" height="26" rx="4" fill="#0A0E1A" opacity="0.4" />
    <rect x="86" y="30" width="30" height="26" rx="4" fill="#0A0E1A" opacity="0.4" />
    <circle cx="34" cy="92" r="11" fill="#161D36" />
    <circle cx="106" cy="92" r="11" fill="#161D36" />
  </svg>
);

export const LikeIcon: React.FC<{ size?: number }> = ({ size = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#161D36" stroke="#2A3560" strokeWidth="3" />
    <path
      d="M35 46 L35 74 L28 74 L28 46 Z M35 46 L46 22 Q50 18 52 24 L52 40 L68 40 Q76 40 74 48 L68 70 Q66 74 60 74 L35 74"
      fill="#F7931A"
    />
  </svg>
);

export const BellIcon: React.FC<{ size?: number }> = ({ size = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#161D36" stroke="#2A3560" strokeWidth="3" />
    <path
      d="M50 24 Q64 24 64 44 Q64 58 70 64 L30 64 Q36 58 36 44 Q36 24 50 24 Z"
      fill="#F7931A"
    />
    <circle cx="50" cy="72" r="6" fill="#F7931A" />
  </svg>
);
