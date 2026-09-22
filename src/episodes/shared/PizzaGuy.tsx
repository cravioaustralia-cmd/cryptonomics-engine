import { useCurrentFrame } from "remotion";

export type PizzaGuyExpression = "curious" | "happy" | "shocked";

/**
 * Original cartoon mascot for the channel: a friendly guy in a 2010-era
 * hoodie + rectangular glasses. One consistent design, three swappable
 * expressions. Used across scenes (and future episodes) instead of any
 * real photo/brand asset.
 */
export const PizzaGuy: React.FC<{
  expression: PizzaGuyExpression;
  size?: number;
  flip?: boolean;
}> = ({ expression, size = 420, flip = false }) => {
  const frame = useCurrentFrame();
  // Gentle idle bob so he never looks like a frozen sticker.
  const bob = Math.sin(frame / 12) * 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      style={{
        transform: `translateY(${bob}px) scaleX(${flip ? -1 : 1})`,
      }}
    >
      {/* Shadow */}
      <ellipse cx="200" cy="372" rx="86" ry="14" fill="#000" opacity="0.25" />

      {/* Hoodie body */}
      <path
        d="M 108 250
           Q 108 190 150 178
           L 165 168
           Q 200 150 235 168
           L 250 178
           Q 292 190 292 250
           L 300 340
           Q 300 360 280 362
           L 120 362
           Q 100 360 100 340
           Z"
        fill="#F7931A"
      />
      {/* Hoodie shading */}
      <path
        d="M 150 178 Q 200 150 235 168 L 250 178 Q 260 210 250 250 L 150 250 Q 140 210 150 178 Z"
        fill="#E17F0E"
        opacity="0.55"
      />
      {/* Hoodie strings */}
      <line
        x1="188"
        y1="196"
        x2="184"
        y2="236"
        stroke="#1B2340"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="212"
        y1="196"
        x2="216"
        y2="236"
        stroke="#1B2340"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="184" cy="240" r="4" fill="#1B2340" />
      <circle cx="216" cy="240" r="4" fill="#1B2340" />

      {/* Hood collar behind head */}
      <path
        d="M 140 190 Q 200 160 260 190 L 255 220 Q 200 195 145 220 Z"
        fill="#C97612"
      />

      {/* Neck */}
      <rect x="182" y="170" width="36" height="30" rx="12" fill="#E8B08C" />

      {/* Head */}
      <circle cx="200" cy="140" r="72" fill="#F2C299" />
      {/* Hair peeking from under hood */}
      <path
        d="M 132 118 Q 128 70 200 62 Q 272 70 268 118 Q 240 92 200 92 Q 160 92 132 118 Z"
        fill="#2A1B12"
      />

      {/* Ears */}
      <circle cx="130" cy="142" r="12" fill="#F2C299" />
      <circle cx="270" cy="142" r="12" fill="#F2C299" />

      <Face expression={expression} />

      {/* Arms */}
      <Arm expression={expression} side="left" />
      <Arm expression={expression} side="right" />
    </svg>
  );
};

const Face: React.FC<{ expression: PizzaGuyExpression }> = ({
  expression,
}) => {
  return (
    <g>
      {/* Glasses (2010-era thick rectangular frames) */}
      <g stroke="#1B2340" strokeWidth="6" fill="#0A0E1A" fillOpacity="0.12">
        <rect x="150" y="120" width="44" height="34" rx="6" />
        <rect x="206" y="120" width="44" height="34" rx="6" />
        <line x1="194" y1="136" x2="206" y2="136" />
        <line x1="150" y1="132" x2="132" y2="126" strokeLinecap="round" />
        <line x1="250" y1="132" x2="268" y2="126" strokeLinecap="round" />
      </g>

      {expression === "curious" && (
        <g>
          <circle cx="172" cy="137" r="5" fill="#1B2340" />
          <circle cx="228" cy="137" r="5" fill="#1B2340" />
          <path
            d="M 156 108 Q 172 98 188 106"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 212 104 Q 228 92 248 100"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 190 172 Q 200 180 212 170"
            stroke="#8A4A2A"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {expression === "happy" && (
        <g>
          <path
            d="M 160 136 Q 172 124 184 136"
            stroke="#1B2340"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 216 136 Q 228 124 240 136"
            stroke="#1B2340"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 158 104 Q 172 96 186 102"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 214 102 Q 228 96 242 104"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 176 168 Q 200 194 224 168"
            stroke="#8A4A2A"
            strokeWidth="6"
            fill="#FFFFFF"
            strokeLinecap="round"
          />
          <circle cx="160" cy="152" r="10" fill="#F0906B" opacity="0.5" />
          <circle cx="240" cy="152" r="10" fill="#F0906B" opacity="0.5" />
        </g>
      )}

      {expression === "shocked" && (
        <g>
          <circle
            cx="172"
            cy="137"
            r="9"
            fill="#FFFFFF"
            stroke="#1B2340"
            strokeWidth="3"
          />
          <circle
            cx="228"
            cy="137"
            r="9"
            fill="#FFFFFF"
            stroke="#1B2340"
            strokeWidth="3"
          />
          <circle cx="172" cy="137" r="4" fill="#1B2340" />
          <circle cx="228" cy="137" r="4" fill="#1B2340" />
          <path
            d="M 154 100 Q 172 86 190 98"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 210 98 Q 228 86 246 100"
            stroke="#2A1B12"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="200" cy="180" rx="16" ry="20" fill="#5A2E1A" />
          <path
            d="M 254 118 L 266 108 M 258 128 L 272 124"
            stroke="#4FA8E0"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

const Arm: React.FC<{
  expression: PizzaGuyExpression;
  side: "left" | "right";
}> = ({ expression, side }) => {
  const isRaised = expression === "shocked" || expression === "happy";
  const flipX = side === "left" ? 1 : -1;
  const baseX = side === "left" ? 112 : 288;

  return (
    <g transform={`translate(${baseX}, 260)`}>
      <path
        d={
          isRaised
            ? `M 0 0 Q ${-18 * flipX} -40 ${-6 * flipX} -74`
            : `M 0 0 Q ${-6 * flipX} 30 ${2 * flipX} 62`
        }
        stroke="#F7931A"
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx={isRaised ? -6 * flipX : 2 * flipX}
        cy={isRaised ? -74 : 62}
        r="15"
        fill="#F2C299"
      />
    </g>
  );
};
