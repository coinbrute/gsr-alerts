import { NextResponse } from "next/server";
import { fetchBtcUsd } from "@/lib/prices";

export async function GET() {
  try {
    const btcUsd = await fetchBtcUsd();
    return NextResponse.json({ btcUsd });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
