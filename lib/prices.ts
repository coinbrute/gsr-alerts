import Coingecko from "@coingecko/coingecko-typescript";

export type GoldApiResp = {
  metal: string;
  currency: string;
  price: number;
  ch?: number; // change
  chp?: number; // change percent
  ask?: number;
  bid?: number;
  timestamp?: number;
};

export async function fetchMetalsUsd() {
  const key = process.env.GOLDAPI_KEY;
  if (!key) return null;

  // GoldAPI.io returns prices directly in USD per ounce
  const baseUrl = "https://www.goldapi.io";
  
  const [goldRes, silverRes] = await Promise.all([
    fetch(`${baseUrl}/api/XAU/USD`, { cache: "no-store", headers: { "x-access-token": key } }),
    fetch(`${baseUrl}/api/XAG/USD`, { cache: "no-store", headers: { "x-access-token": key } }),
  ]);

  if (!goldRes.ok || !silverRes.ok) {
    const goldText = await goldRes.text().catch(() => "");
    const silverText = await silverRes.text().catch(() => "");
    throw new Error(
      `GoldAPI error: Gold ${goldRes.status} ${goldText}, Silver ${silverRes.status} ${silverText}`
    );
  }

  const goldJson: GoldApiResp = await goldRes.json();
  const silverJson: GoldApiResp = await silverRes.json();

  if (!goldJson.price || !silverJson.price) {
    throw new Error("GoldAPI: Missing price in response");
  }

  return {
    goldUsd: goldJson.price,
    silverUsd: silverJson.price,
  };
}

export async function fetchBtcUsd() {
  // Use free tier if no API key is provided, otherwise use Pro/Demo API
  const proApiKey = process.env["COINGECKO_PRO_API_KEY"];
  const demoApiKey = process.env["COINGECKO_DEMO_API_KEY"];
  
  const clientConfig = proApiKey
    ? { proAPIKey: proApiKey, environment: "pro" as const } // Pro tier
    : demoApiKey
    ? { demoAPIKey: demoApiKey, environment: "demo" as const } // Demo tier
    : {}; // Free tier - no API key needed
  
  const client = new Coingecko(clientConfig);

  const params: Coingecko.Simple.PriceGetParams = {
    vs_currencies: "usd",
    ids: "bitcoin",
  };
  const price: Coingecko.Simple.PriceGetResponse =
    await client.simple.price.get(params);
  const btcUsd = price.bitcoin?.usd;
  if (!btcUsd) throw new Error("CoinGecko BTC price missing");
  return btcUsd;
}
