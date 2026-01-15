"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";

import { bandForGsr, DEFAULT_BANDS } from "@/lib/doctrine";
import { AppState, Snapshot, loadState, saveState } from "@/lib/storage";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

type PriceResp = {
  ts: number;
  btcUsd: number;
  goldUsd: number | null;
  silverUsd: number | null;
  gsr: number | null;
};

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 16
  };
}

function pill(sev: "none" | "info" | "warn" | "alert"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    color: "var(--text)"
  };
  if (sev === "info") return { ...base, borderColor: "rgba(122,162,255,0.45)" };
  if (sev === "warn") return { ...base, borderColor: "rgba(255,200,80,0.55)" };
  if (sev === "alert") return { ...base, borderColor: "rgba(255,90,90,0.60)" };
  return base;
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [live, setLive] = useState<PriceResp | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const latestStateRef = useRef(state);

  // persist state
  useEffect(() => {
    saveState(state);
    latestStateRef.current = state;
  }, [state]);

  async function refresh() {
    setStatus("Fetching prices...");
    const ts = Date.now();
    const currentState = latestStateRef.current;

    // Fetch BTC price from CoinGecko
    const btcRes = await fetch("/api/prices/btc", { cache: "no-store" });
    const btcData = await btcRes.json();
    if (!btcRes.ok || !btcData.btcUsd) {
      setStatus(`Error fetching BTC price: ${btcData.error || "Unknown error"}`);
      return;
    }

    // Fetch metals prices from GoldAPI
    const metalsRes = await fetch("/api/prices/metals", { cache: "no-store" });
    const metalsData = await metalsRes.json();

    const btcUsd = btcData.btcUsd;
    const goldUsd = metalsData.goldUsd ?? currentState.manualGoldUsd ?? null;
    const silverUsd = metalsData.silverUsd ?? currentState.manualSilverUsd ?? null;

    const json: PriceResp = {
      ts,
      btcUsd,
      goldUsd,
      silverUsd,
      gsr: goldUsd && silverUsd ? goldUsd / silverUsd : null,
    };
    setLive(json);

    if (!goldUsd || !silverUsd) {
      setStatus("Missing gold/silver live prices. Set manual fallback or configure GOLDAPI_KEY.");
      return;
    }

    const gsr = goldUsd / silverUsd;

    const { holdings } = currentState;

    const btcValueUsd = holdings.btc * btcUsd;
    const goldValueUsd = holdings.goldOz * goldUsd;
    const silverValueUsd = holdings.silverOz * silverUsd;

    const portfolioUsd = btcValueUsd + goldValueUsd + silverValueUsd;

    // Gold-equivalent: gold oz + silver converted at current ratio + BTC converted to gold via USD prices
    const portfolioGoldEqOz =
      holdings.goldOz +
      (holdings.silverOz / gsr) +
      (btcValueUsd / goldUsd);

    const snap: Snapshot = {
      ts,
      btcUsd,
      goldUsd,
      silverUsd,
      gsr,
      btcValueUsd,
      goldValueUsd,
      silverValueUsd,
      portfolioUsd,
      portfolioGoldEqOz
    };

    const band = bandForGsr(gsr, DEFAULT_BANDS);

    // On band change, produce a prominent status update
    if (band && band.id !== currentState.lastBandId) {
      setStatus(`ALERT: GSR entered ${band.label} → ${band.action}`);
      setState((s) => ({
        ...s,
        lastBandId: band.id,
        snapshots: [...s.snapshots, snap].slice(-1000)
      }));
      return;
    }

    setStatus("Updated.");
    setState((s) => ({
      ...s,
      snapshots: [...s.snapshots, snap].slice(-1000)
    }));
  }

  // auto-refresh cadence
  useEffect(() => {
    refresh();
    const ms = Math.max(1, state.refreshMinutes) * 60 * 1000;
    const t = setInterval(refresh, ms);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.refreshMinutes]);

  const resolvedMetals = useMemo(() => {
    const goldUsd = live?.goldUsd ?? state.manualGoldUsd ?? null;
    const silverUsd = live?.silverUsd ?? state.manualSilverUsd ?? null;
    return { goldUsd, silverUsd };
  }, [live, state.manualGoldUsd, state.manualSilverUsd]);

  const currentGsr = useMemo(() => {
    const { goldUsd, silverUsd } = resolvedMetals;
    if (!goldUsd || !silverUsd) return null;
    return goldUsd / silverUsd;
  }, [resolvedMetals]);

  const currentBand = useMemo(() => {
    if (!currentGsr) return null;
    return bandForGsr(currentGsr, DEFAULT_BANDS);
  }, [currentGsr]);

  const labels = state.snapshots.map((s) => new Date(s.ts).toLocaleString());

  const usdChart = {
    labels,
    datasets: [
      {
        label: "BTC Value (USD)",
        data: state.snapshots.map((s) => s.btcValueUsd),
        borderColor: "rgb(122,162,255)",
        backgroundColor: "rgba(122,162,255,0.2)"
      },
      {
        label: "Gold Value (USD)",
        data: state.snapshots.map((s) => s.goldValueUsd),
        borderColor: "rgb(255,203,102)",
        backgroundColor: "rgba(255,203,102,0.25)"
      },
      {
        label: "Silver Value (USD)",
        data: state.snapshots.map((s) => s.silverValueUsd),
        borderColor: "rgb(196,203,214)",
        backgroundColor: "rgba(196,203,214,0.25)"
      },
      {
        label: "Total Portfolio (USD)",
        data: state.snapshots.map((s) => s.portfolioUsd),
        borderColor: "rgb(120,200,168)",
        backgroundColor: "rgba(120,200,168,0.25)"
      }
    ]
  };

  const goldEqChart = {
    labels,
    datasets: [
      {
        label: "Total (Gold-Equivalent oz)",
        data: state.snapshots.map((s) => s.portfolioGoldEqOz),
        borderColor: "rgb(255,159,64)",
        backgroundColor: "rgba(255,159,64,0.25)"
      }
    ]
  };

  const liveComponentValues = useMemo(() => {
    if (!live) return null;
    const { goldUsd, silverUsd } = resolvedMetals;
    if (!goldUsd || !silverUsd) return null;

    const btcValueUsd = state.holdings.btc * live.btcUsd;
    const goldValueUsd = state.holdings.goldOz * goldUsd;
    const silverValueUsd = state.holdings.silverOz * silverUsd;
    const totalUsd = btcValueUsd + goldValueUsd + silverValueUsd;

    return { btcValueUsd, goldValueUsd, silverValueUsd, totalUsd };
  }, [live, resolvedMetals, state.holdings]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
        <div>
          <h1 style={{ margin: 0 }}>GSR Alerts + Portfolio Tracker</h1>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Physical metals + BTC tracking with doctrine-band alerts (local-only storage).
          </div>
        </div>

        <button
          onClick={refresh}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text)"
          }}
        >
          Refresh now
        </button>
      </div>

      <div style={{ marginTop: 16, ...cardStyle() }}>
        <b>Status:</b> {status}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Holdings</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              BTC
              <input
                type="number"
                step="0.00000001"
                value={state.holdings.btc}
                onChange={(e) =>
                  setState((s) => ({ ...s, holdings: { ...s.holdings, btc: Number(e.target.value) } }))
                }
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Silver (oz)
              <input
                type="number"
                step="0.01"
                value={state.holdings.silverOz}
                onChange={(e) =>
                  setState((s) => ({ ...s, holdings: { ...s.holdings, silverOz: Number(e.target.value) } }))
                }
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Gold (oz)
              <input
                type="number"
                step="0.01"
                value={state.holdings.goldOz}
                onChange={(e) =>
                  setState((s) => ({ ...s, holdings: { ...s.holdings, goldOz: Number(e.target.value) } }))
                }
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Auto-refresh (minutes)
              <input
                type="number"
                step="1"
                min="1"
                value={state.refreshMinutes}
                onChange={(e) => setState((s) => ({ ...s, refreshMinutes: Number(e.target.value) }))}
              />
            </label>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Snapshots are stored in your browser (up to 1000 entries). No server database.
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Live Prices</h2>

          {live ? (
            <>
              <div style={{ display: "grid", gap: 6 }}>
                <div>BTC/USD: <b>{fmt(live.btcUsd, 2)}</b></div>
                <div>Gold USD/oz: <b>{resolvedMetals.goldUsd ? fmt(resolvedMetals.goldUsd, 2) : "—"}</b></div>
                <div>Silver USD/oz: <b>{resolvedMetals.silverUsd ? fmt(resolvedMetals.silverUsd, 2) : "—"}</b></div>
                <div>GSR: <b>{currentGsr ? fmt(currentGsr, 2) : "—"}</b></div>

                <div style={{ marginTop: 6 }}>
                  <span style={pill(currentBand?.severity ?? "none")}>
                    Band: {currentBand ? `${currentBand.label}` : "—"}
                  </span>
                </div>

                <div style={{ marginTop: 8, color: "var(--muted)" }}>
                  Action: <b style={{ color: "var(--text)" }}>{currentBand ? currentBand.action : "—"}</b>
                </div>
              </div>

              {liveComponentValues && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>Portfolio (Live)</h3>
                  <div>BTC value: <b>${fmt(liveComponentValues.btcValueUsd, 2)}</b></div>
                  <div>Gold value: <b>${fmt(liveComponentValues.goldValueUsd, 2)}</b></div>
                  <div>Silver value: <b>${fmt(liveComponentValues.silverValueUsd, 2)}</b></div>
                  <div style={{ marginTop: 6 }}>Total: <b>${fmt(liveComponentValues.totalUsd, 2)}</b></div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "var(--muted)" }}>Loading…</div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <h3 style={{ marginTop: 0 }}>Manual Metals Fallback (USD/oz)</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Gold USD/oz
                <input
                  type="number"
                  step="0.01"
                  value={state.manualGoldUsd ?? ""}
                  onChange={(e) => setState((s) => ({ ...s, manualGoldUsd: Number(e.target.value) }))}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                Silver USD/oz
                <input
                  type="number"
                  step="0.01"
                  value={state.manualSilverUsd ?? ""}
                  onChange={(e) => setState((s) => ({ ...s, manualSilverUsd: Number(e.target.value) }))}
                />
              </label>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Use this if GoldAPI isn't configured or rate-limited. BTC price still updates live.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 16, ...cardStyle() }}>
        <h2 style={{ marginTop: 0 }}>Portfolio Value (USD)</h2>
        <Line data={usdChart} />
      </section>

      <section style={{ marginTop: 16, ...cardStyle() }}>
        <h2 style={{ marginTop: 0 }}>Portfolio Total (Gold-Equivalent oz)</h2>
        <Line data={goldEqChart} />
        <div style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>
          Gold-equivalent converts silver at current GSR and BTC via USD-to-gold conversion.
        </div>
      </section>

      <section style={{ marginTop: 16, ...cardStyle() }}>
        <h2 style={{ marginTop: 0 }}>Doctrine Bands</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {DEFAULT_BANDS.map((b) => (
            <li key={b.id} style={{ marginBottom: 8 }}>
              <b>{b.label}</b> — {b.action}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 16, ...cardStyle() }}>
        <h2 style={{ marginTop: 0 }}>Data Controls</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => setState((s) => ({ ...s, snapshots: [] }))}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)"
            }}
          >
            Clear snapshots
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("gsr_alerts_v1");
              setState(loadState());
              setStatus("Local state reset.");
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)"
            }}
          >
            Reset app state
          </button>
        </div>

        <div style={{ color: "var(--muted)", marginTop: 10, fontSize: 13 }}>
          Reset wipes holdings/threshold state and snapshot history stored in your browser.
        </div>
      </section>

      <footer style={{ marginTop: 28, color: "var(--muted)", fontSize: 13 }}>
        v1.0 — localStorage-only. Next step for “real alerts” is push/email/SMS + cooldowns.
      </footer>
    </main>
  );
}
