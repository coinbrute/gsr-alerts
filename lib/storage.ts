export type Holdings = {
    btc: number;
    silverOz: number;
    goldOz: number;
  };
  
  export type Snapshot = {
    ts: number;
  
    btcUsd: number;     // BTC spot
    goldUsd: number;    // Gold USD/oz
    silverUsd: number;  // Silver USD/oz
    gsr: number;        // goldUsd / silverUsd
  
    btcValueUsd: number;
    goldValueUsd: number;
    silverValueUsd: number;
  
    portfolioUsd: number;
    portfolioGoldEqOz: number;
  };
  
  const KEY = "gsr_alerts_v1";
  
  export type AppState = {
    holdings: Holdings;
    snapshots: Snapshot[];
    lastBandId?: string;
  
    // optional manual fallback if Metals-API not configured
    manualGoldUsd?: number;
    manualSilverUsd?: number;
  
    // basic settings
    refreshMinutes: number; // auto-refresh interval
  };
  
  export const DEFAULT_STATE: AppState = {
    holdings: { btc: 0.20619573, silverOz: 167, goldOz: 1.1 },
    snapshots: [],
    lastBandId: undefined,
    manualGoldUsd: undefined,
    manualSilverUsd: undefined,
    refreshMinutes: 15
  };
  
  export function loadState(): AppState {
    if (typeof window === "undefined") return DEFAULT_STATE;
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        holdings: { ...DEFAULT_STATE.holdings, ...(parsed.holdings ?? {}) },
        snapshots: parsed.snapshots ?? DEFAULT_STATE.snapshots
      };
    } catch {
      return DEFAULT_STATE;
    }
  }
  
  export function saveState(state: AppState) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  