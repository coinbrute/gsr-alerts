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

export async function fetchAUGAUTUsd() {
  // Use free tier if no API key is provided, otherwise use Pro/Demo API
  const proApiKey = process.env["COINGECKO_PRO_API_KEY"];
  const demoApiKey = process.env["COINGECKO_DEMO_API_KEY"];
  
  const clientConfig = proApiKey
    ? { proAPIKey: proApiKey, environment: "pro" as const } // Pro tier
    : demoApiKey
    ? { demoAPIKey: demoApiKey, environment: "demo" as const } // Demo tier
    : {}; // Free tier - no API key needed
  
  const client = new Coingecko(clientConfig);

  const goldParams: Coingecko.Simple.PriceGetParams = {
    vs_currencies: "usd",
    ids: "tether-gold",
  };
  const silverParams: Coingecko.Simple.PriceGetParams = {
    vs_currencies: "usd",
    ids: "kinesis-silver",
  };
  const goldPrice: Coingecko.Simple.PriceGetResponse =
    await client.simple.price.get(goldParams);
  const silverPrice: Coingecko.Simple.PriceGetResponse =
    await client.simple.price.get(silverParams);
  const goldUsd = goldPrice["tether-gold"].usd;
  const silverUsd = silverPrice["kinesis-silver"].usd;
  if (!goldUsd || !silverUsd) throw new Error("CoinGecko gold or silver price missing");
  return {goldUsd: goldUsd, silverUsd:silverUsd};
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
