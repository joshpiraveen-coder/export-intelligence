"use client";

import { motion } from "framer-motion";

// Approximate capital-city coordinates for the countries in this platform's
// regulation database, plus Sri Lanka as the export origin.
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  LK: { lat: 6.9, lng: 79.9 },
  GB: { lat: 51.5, lng: -0.1 },
  US: { lat: 38.9, lng: -77.0 },
  CA: { lat: 45.4, lng: -75.7 },
  AU: { lat: -35.3, lng: 149.1 },
  AE: { lat: 25.2, lng: 55.3 },
  DE: { lat: 52.5, lng: 13.4 },
  SG: { lat: 1.35, lng: 103.8 },
  JP: { lat: 35.7, lng: 139.7 },
  IN: { lat: 28.6, lng: 77.2 },
  QA: { lat: 25.3, lng: 51.5 },
  FR: { lat: 48.9, lng: 2.3 },
  NL: { lat: 52.4, lng: 4.9 },
  SA: { lat: 24.7, lng: 46.7 },
  NZ: { lat: -41.3, lng: 174.8 },
};

function project(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

interface WorldMapProps {
  destinations: { name: string; isoCode: string; count: number }[];
  originIso?: string;
  width?: number;
  height?: number;
}

export function WorldMap({ destinations, originIso = "LK", width = 640, height = 300 }: WorldMapProps) {
  const origin = COUNTRY_COORDS[originIso];
  const points = destinations
    .filter((d) => COUNTRY_COORDS[d.isoCode])
    .map((d) => ({ ...d, ...project(COUNTRY_COORDS[d.isoCode].lat, COUNTRY_COORDS[d.isoCode].lng, width, height) }));
  const originPoint = origin ? project(origin.lat, origin.lng, width, height) : null;
  const maxCount = Math.max(1, ...points.map((p) => p.count));

  // Graticule lines (decorative grid suggesting a world map)
  const vLines = Array.from({ length: 7 }, (_, i) => (i + 1) * (width / 8));
  const hLines = Array.from({ length: 4 }, (_, i) => (i + 1) * (height / 5));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Export destination map">
      <rect x={0} y={0} width={width} height={height} rx={12} fill="hsl(var(--secondary))" opacity={0.4} />
      {vLines.map((x, i) => (
        <line key={`v${i}`} x1={x} y1={0} x2={x} y2={height} stroke="hsl(var(--border))" strokeWidth={1} />
      ))}
      {hLines.map((y, i) => (
        <line key={`h${i}`} x1={0} y1={y} x2={width} y2={y} stroke="hsl(var(--border))" strokeWidth={1} />
      ))}

      {originPoint &&
        points.map((p, i) => {
          const mx = (originPoint.x + p.x) / 2;
          const my = Math.min(originPoint.y, p.y) - 24;
          const path = `M ${originPoint.x} ${originPoint.y} Q ${mx} ${my} ${p.x} ${p.y}`;
          return (
            <motion.path
              key={`path-${p.isoCode}`}
              d={path}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1, delay: 0.1 * i }}
            />
          );
        })}

      {originPoint && (
        <g>
          <circle cx={originPoint.x} cy={originPoint.y} r={5} fill="hsl(var(--luxury-navy))" />
          <text x={originPoint.x} y={originPoint.y - 10} textAnchor="middle" fontSize={10} fill="hsl(var(--foreground))" fontWeight={600}>
            Sri Lanka
          </text>
        </g>
      )}

      {points.map((p) => (
        <g key={p.isoCode}>
          <circle cx={p.x} cy={p.y} r={3.5 + (p.count / maxCount) * 5} fill="hsl(var(--primary))" opacity={0.85} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">
            {p.name}
          </text>
        </g>
      ))}

      {points.length === 0 && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={12} fill="hsl(var(--muted-foreground))">
          No export destinations analyzed yet
        </text>
      )}
    </svg>
  );
}
