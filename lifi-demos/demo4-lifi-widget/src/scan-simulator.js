const TIME_BUCKET_MS = 30_000;

export const SCAN_EXCHANGES = [
  { id: "binance", name: "Binance", fee: 0.1, liquidity: 4_200_000 },
  { id: "coinbase", name: "Coinbase", fee: 0.25, liquidity: 3_100_000 },
  { id: "kraken", name: "Kraken", fee: 0.16, liquidity: 1_650_000 },
  { id: "bybit", name: "Bybit", fee: 0.1, liquidity: 1_450_000 },
  { id: "okx", name: "OKX", fee: 0.1, liquidity: 2_050_000 },
  { id: "kucoin", name: "KuCoin", fee: 0.1, liquidity: 520_000 },
];

export const SCAN_PAIRS = [
  { id: "BTC-USDT", display: "BTC/USDT", price: 64_000, volatility: 0.1, bias: 0.3, scale: 1, withdrawal: 0.0002 },
  { id: "ETH-USDT", display: "ETH/USDT", price: 3_400, volatility: 0.12, bias: 0.32, scale: 0.85, withdrawal: 0.0025 },
  { id: "SOL-USDT", display: "SOL/USDT", price: 145, volatility: 0.18, bias: 0.45, scale: 0.4, withdrawal: 0.01 },
  { id: "XRP-USDT", display: "XRP/USDT", price: 0.62, volatility: 0.22, bias: 0.5, scale: 0.35, withdrawal: 0.2 },
  { id: "ADA-USDT", display: "ADA/USDT", price: 0.45, volatility: 0.22, bias: 0.5, scale: 0.25, withdrawal: 0.6 },
  { id: "DOGE-USDT", display: "DOGE/USDT", price: 0.14, volatility: 0.28, bias: 0.55, scale: 0.3, withdrawal: 6 },
  { id: "LTC-USDT", display: "LTC/USDT", price: 78, volatility: 0.16, bias: 0.4, scale: 0.45, withdrawal: 0.001 },
  { id: "AVAX-USDT", display: "AVAX/USDT", price: 28, volatility: 0.2, bias: 0.48, scale: 0.35, withdrawal: 0.01 },
];

function hashString(input) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(key) {
  let seed = hashString(key) >>> 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function quote(pair, exchange, bucket) {
  const bias = (seededUnit(`bias:${pair.id}:${exchange.id}`) - 0.5) * 2 * (pair.bias / 100);
  const noise = (seededUnit(`tick:${pair.id}:${exchange.id}:${bucket}`) - 0.5) * 2 * (pair.volatility / 100);
  return {
    price: pair.price * (1 + bias + noise),
    liquidity: exchange.liquidity * pair.scale * (0.7 + seededUnit(`depth:${pair.id}:${exchange.id}:${bucket}`) * 0.6),
    fee: Math.max(0.02, exchange.fee * (1 + (seededUnit(`fee:${pair.id}:${exchange.id}:${bucket}`) - 0.5) * 0.1)),
  };
}

export function rankScan({ pairs, exchanges, capitalUsd, minSpreadPct, maxResults = 24, now = Date.now() }) {
  const bucket = Math.floor(now / TIME_BUCKET_MS);
  const results = [];
  let scannedCount = 0;
  for (const pair of SCAN_PAIRS.filter((item) => pairs.includes(item.id))) {
    for (const buyExchange of SCAN_EXCHANGES.filter((item) => exchanges.includes(item.id))) {
      for (const sellExchange of SCAN_EXCHANGES.filter((item) => exchanges.includes(item.id))) {
        if (buyExchange.id === sellExchange.id) continue;
        scannedCount += 1;
        const buy = quote(pair, buyExchange, bucket);
        const sell = quote(pair, sellExchange, bucket);
        const units = capitalUsd / buy.price;
        const grossSpreadPct = ((sell.price - buy.price) / buy.price) * 100;
        const buyFee = capitalUsd * (buy.fee / 100);
        const sellFee = units * sell.price * (sell.fee / 100);
        const withdrawalFee = pair.withdrawal * buy.price;
        const utilizationPct = (capitalUsd / Math.min(buy.liquidity, sell.liquidity)) * 100;
        const slippagePct = Math.max(0, (utilizationPct / 100 - 0.02) * 0.6 * 100);
        const slippage = capitalUsd * (slippagePct / 100);
        const totalCostsUsd = buyFee + sellFee + withdrawalFee + slippage;
        const netOutcomeUsd = units * sell.price - capitalUsd - totalCostsUsd;
        if (grossSpreadPct < minSpreadPct) continue;
        const netOutcomePct = (netOutcomeUsd / capitalUsd) * 100;
        const confidence = netOutcomeUsd <= 0 ? "low" : utilizationPct < 5 && netOutcomePct > 0.15 ? "high" : utilizationPct < 20 && netOutcomePct > 0.03 ? "medium" : "low";
        results.push({
          id: `${pair.id}:${buyExchange.id}:${sellExchange.id}`,
          pair: pair.display,
          buy: buyExchange.name,
          sell: sellExchange.name,
          grossSpreadPct,
          netOutcomeUsd,
          totalCostsUsd,
          confidence,
          action: `Buy on ${buyExchange.name}, transfer, sell on ${sellExchange.name}`,
        });
      }
    }
  }
  results.sort((left, right) => right.netOutcomeUsd - left.netOutcomeUsd);
  return { opportunities: results.slice(0, maxResults), scannedCount, generatedAt: new Date(bucket * TIME_BUCKET_MS).toISOString() };
}


