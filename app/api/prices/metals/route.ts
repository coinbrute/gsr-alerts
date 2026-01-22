import { NextResponse } from "next/server";
import { fetchAUGAUTUsd } from "@/lib/prices";

export async function GET() {
  try {
    const metals = await fetchAUGAUTUsd();
    if (!metals) {
      return NextResponse.json({ goldUsd: null, silverUsd: null });
    }
    return NextResponse.json({
      goldUsd: metals.goldUsd,
      silverUsd: metals.silverUsd,
    });
  } catch (error) {
    // GoldAPI failed or not configured; return null values
    return NextResponse.json({ goldUsd: null, silverUsd: null });
  }
}
