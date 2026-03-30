import fs from "fs";
import StocksTable from "./StocksTable";

const EOD_PATH =
  "/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json";
const BACKEND = "http://localhost:3000/api";

interface Stock {
  ticker: string;
  companyName: string;
  sector: string;
  last: number | null;
  var_7d: number | null;
  var_30d: number | null;
  volume: number | null;
  change_pct: number | null;
}

interface EodStock {
  ticker: string;
  company?: string;
  last?: number | null;
  var_7d?: number | null;
  var_30d?: number | null;
  volume?: number | null;
  change_pct?: number | null;
}

async function getStocks(): Promise<Stock[]> {
  let backendStocks: Array<{ ticker: string; companyName: string; sector?: string }> = [];
  try {
    const res = await fetch(`${BACKEND}/stocks`, { next: { revalidate: 60 } });
    if (res.ok) backendStocks = await res.json();
  } catch {
    // backend unavailable
  }

  let eodMap: Record<string, EodStock> = {};
  try {
    const raw = fs.readFileSync(EOD_PATH, "utf-8");
    const eodData = JSON.parse(raw);
    const list = Array.isArray(eodData) ? eodData : (eodData.stocks || []);
    for (const s of list) {
      if (s && s.ticker) eodMap[s.ticker] = s;
    }
  } catch {
    // EOD data unavailable
  }

  return backendStocks
    .map((s) => {
      const eod = eodMap[s.ticker] || {};
      return {
        ticker: s.ticker,
        companyName: eod.company || s.companyName || "",
        sector: s.sector || "",
        last: eod.last ?? null,
        var_7d: eod.var_7d ?? null,
        var_30d: eod.var_30d ?? null,
        volume: eod.volume ?? null,
        change_pct: eod.change_pct ?? null,
      };
    })
    .filter((s) => s.last != null);
}

export const dynamic = "force-dynamic";

export default async function StocksPage() {
  const stocks = await getStocks();

  return (
    <div style={{ padding: "24px", color: "#fff", minHeight: "100vh", background: "#0a0f0d" }}>
      <h1 style={{ color: "#00ff88", marginBottom: "24px", fontSize: "1.5rem", fontWeight: 700 }}>
        Cours des titres
        <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "0.9rem", marginLeft: 12 }}>
          {stocks.length} actions
        </span>
      </h1>

      <StocksTable stocks={stocks} />
    </div>
  );
}
