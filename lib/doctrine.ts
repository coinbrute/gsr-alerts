export type DoctrineBand = {
    id: string;
    min?: number; // inclusive
    max?: number; // exclusive
    label: string;
    action: string;
    severity: "none" | "info" | "warn" | "alert";
  };
  
  export const DEFAULT_BANDS: DoctrineBand[] = [
    { id: "gt80", min: 80, label: "> 80", action: "Rotate GOLD → SILVER (20–40% of gold)", severity: "info" },
    { id: "70-80", min: 70, max: 80, label: "70–80", action: "Accumulate silver slowly (cash only)", severity: "info" },
    { id: "60-70", min: 60, max: 70, label: "60–70", action: "HOLD", severity: "none" },
    { id: "55-60", min: 55, max: 60, label: "55–60", action: "HOLD / Prep mentally", severity: "none" },
    { id: "50-55", min: 50, max: 55, label: "50–55", action: "NO new silver buys", severity: "warn" },
    { id: "45-50", min: 45, max: 50, label: "45–50", action: "Rotate 20–30% SILVER → GOLD", severity: "warn" },
    { id: "40-45", min: 40, max: 45, label: "40–45", action: "Rotate 40–60% SILVER → GOLD", severity: "alert" },
    { id: "lt40", max: 40, label: "< 40", action: "Rotate 60–80% SILVER → GOLD (keep tail)", severity: "alert" }
  ];
  
  export function bandForGsr(gsr: number, bands: DoctrineBand[] = DEFAULT_BANDS) {
    return (
      bands.find(
        (b) =>
          (b.min === undefined || gsr >= b.min) &&
          (b.max === undefined || gsr < b.max)
      ) ?? null
    );
  }
  