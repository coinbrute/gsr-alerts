import { NextResponse } from "next/server";
import { fetchBtcUsd, fetchMetalsUsd } from "@/lib/prices";

export async function GET() {
  const ts = Date.now();

  const btcUsd = await fetchBtcUsd();

  let goldUsd: number | null = null;
  let silverUsd: number | null = null;

  try {
    const metals = await fetchMetalsUsd();
    if (metals) {
      goldUsd = metals.goldUsd;
      silverUsd = metals.silverUsd;
    }
  } catch {
    // GoldAPI failed or not configured; caller can use manual fallback
    goldUsd = null;
    silverUsd = null;
  }

  const gsr = goldUsd && silverUsd ? goldUsd / silverUsd : null;

  return NextResponse.json({ ts, btcUsd, goldUsd, silverUsd, gsr });
}
