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

const EXAMPLE_HOLDINGS: Holdings = {
  btc: 1,
  silverOz: 1,
  goldOz: 1
};
  
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
  holdings: { btc: 0, silverOz: 0, goldOz: 0 },
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
    const parsedHoldings: Partial<Holdings> = parsed.holdings ?? {};
    const isLegacyDefaults =
      parsedHoldings.btc === EXAMPLE_HOLDINGS.btc &&
      parsedHoldings.silverOz === EXAMPLE_HOLDINGS.silverOz &&
      parsedHoldings.goldOz === EXAMPLE_HOLDINGS.goldOz;
      return {
        ...DEFAULT_STATE,
        ...parsed,
      holdings: isLegacyDefaults
        ? { ...DEFAULT_STATE.holdings }
        : { ...DEFAULT_STATE.holdings, ...parsedHoldings },
        snapshots: parsed.snapshots ?? DEFAULT_STATE.snapshots
      };
    } catch {
      return DEFAULT_STATE;
    }
  }
  
  export function saveState(state: AppState) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  