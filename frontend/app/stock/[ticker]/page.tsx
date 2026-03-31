import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import StockChart from "./StockChart";
import StockTechnicals from "./StockTechnicals";
import StockCorporate from "./StockCorporate";

const HISTORY_PATH =
  "/data/.openclaw/workspace/brvm-os/dashboard/data/history/all_prices.json";
const EOD_PATH =
  "/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json";
const BACKEND = "http://localhost:3000/api";

interface HistoryPoint {
  time: number;
  value: number;
}

interface StockDetail {
  ticker: string;
  companyName: string;
  sector: string;
  last: number;
  var_7d: number | null;
  var_30d: number | null;
  volume: number | null;
  change_pct: number | null;
  open: number | null;
  prev_close: number | null;
  high: number | null;
  low: number | null;
  history: HistoryPoint[];
  mm20: HistoryPoint[];
  mm50: HistoryPoint[];
  macd: HistoryPoint[];
  macdSignal: HistoryPoint[];
  macdHistogram: HistoryPoint[];
}

function computeMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const valid = slice.filter((v) => v !== null) as number[];
    if (valid.length < period) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  });
}

function computeEMA(data: number[], period: number): (number | null)[] {
  if (data.length < period) return data.map(() => null);
  const k = 2 / (period + 1);
  const result: (number | null)[] = Array(period - 1).fill(null);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function computeMACD(
  closes: number[],
  history: HistoryPoint[]
): { macd: HistoryPoint[]; signal: HistoryPoint[]; histogram: HistoryPoint[] } {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine: (number | null)[] = ema12.map((e12, i) =>
    e12 !== null && ema26[i] !== null ? e12 - ema26[i] : null
  );
  const signalEma = computeEMA(
    macdLine.filter((v): v is number => v !== null),
    9
  );
  // Align signal back to full length
  const signalAligned: (number | null)[] = [];
  let sigIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalAligned.push(null);
    } else {
      signalAligned.push(signalEma[sigIdx++] ?? null);
    }
  }
  const macd = history.map((h, i) => ({
    time: h.time,
    value: macdLine[i] ?? 0,
  }));
  const signal = history.map((h, i) => ({
    time: h.time,
    value: signalAligned[i] ?? 0,
  }));
  const histogram = history.map((h, i) => {
    const m = macdLine[i];
    const s = signalAligned[i];
    return {
      time: h.time,
      value: m !== null && s !== null ? m - s : 0,
    };
  });
  return {
    macd: macd.filter((d) => d.value !== 0),
    signal: signal.filter((d) => d.value !== 0),
    histogram: histogram.filter((d) => d.value !== 0),
  };
}

function parseHistoryForTicker(
  allPrices: Record<string, Record<string, number>>,
  ticker: string
): HistoryPoint[] {
  const dates = Object.keys(allPrices).sort();
  return dates.map((date) => {
    const year = parseInt(date.slice(0, 4));
    const month = parseInt(date.slice(4, 6)) - 1;
    const day = parseInt(date.slice(6, 8));
    const ts = Math.floor(new Date(year, month, day).getTime() / 1000);
    return {
      time: ts as HistoryPoint["time"],
      value: allPrices[date][ticker] ?? 0,
    };
  });
}

async function getStockData(ticker: string): Promise<StockDetail | null> {
  let backendStock: any = null;
  try {
    const res = await fetch(`${BACKEND}/stocks/${ticker}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) backendStock = await res.json();
  } catch { /* backend unavailable */ }

  if (!backendStock) return null;

  let history: HistoryPoint[] = [];
  let mm20: HistoryPoint[] = [];
  let mm50: HistoryPoint[] = [];
  let macd: HistoryPoint[] = [];
  let macdSignal: HistoryPoint[] = [];
  let macdHistogram: HistoryPoint[] = [];
  let high = 0;
  let low = Infinity;

  try {
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    const allPrices: Record<string, Record<string, number>> = JSON.parse(raw);
    history = parseHistoryForTicker(allPrices, ticker);
    const closes = history.map((h) => h.value);
    const ma20vals = computeMA(closes, Math.min(20, closes.length));
    const ma50vals = computeMA(closes, Math.min(50, closes.length));
    const macdResult = computeMACD(closes, history);
    macd = macdResult.macd;
    macdSignal = macdResult.signal;
    macdHistogram = macdResult.histogram;
    mm20 = history
      .map((h, i) => ({ time: h.time, value: ma20vals[i] ?? h.value }))
      .filter((h) => h.value !== null) as HistoryPoint[];
    mm50 = history
      .map((h, i) => ({ time: h.time, value: ma50vals[i] ?? h.value }))
      .filter((h) => h.value !== null) as HistoryPoint[];
    const priceVals = closes.filter((v) => v > 0);
    if (priceVals.length > 0) {
      high = Math.max(...priceVals);
      low = Math.min(...priceVals);
    }
  } catch { /* no history */ }

  let eod: any = null;
  try {
    const eodRaw = fs.readFileSync(EOD_PATH, "utf-8");
    const eodData = JSON.parse(eodRaw);
    if (Array.isArray(eodData)) {
      eod = eodData.find((s: any) => s.ticker === ticker) || null;
    } else if (eodData.stocks) {
      eod = eodData.stocks.find((s: any) => s.ticker === ticker) || null;
    }
  } catch { /* ignore */ }

  const lastPrice = history.length > 0 ? history[history.length - 1].value : null;
  const prevPrice = history.length > 1 ? history[history.length - 2].value : null;
  const change_pct =
    lastPrice && prevPrice && prevPrice !== 0
      ? ((lastPrice - prevPrice) / prevPrice) * 100
      : null;

  return {
    ticker,
    companyName: backendStock.companyName || backendStock.company_name || ticker,
    sector: backendStock.sector || "",
    last: lastPrice ?? eod?.last ?? 0,
    var_7d: eod?.var_7d ?? null,
    var_30d: eod?.var_30d ?? null,
    volume: eod?.volume ?? null,
    change_pct: change_pct ?? eod?.change_pct ?? null,
    open: eod?.open ?? null,
    prev_close: eod?.prev_close ?? null,
    high: (high || 0) || (eod?.high ?? null),
    low: (low !== Infinity ? low : null) || (eod?.low ?? null),
    history,
    mm20,
    mm50,
    macd,
    macdSignal,
    macdHistogram,
  };
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const data = await getStockData(ticker);

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
        Titre {ticker} non trouvé.
        <br />
        <a href="/stocks" style={{ color: "var(--green)", marginTop: 16, display: "inline-block" }}>
          ← Retour aux cours
        </a>
      </div>
    );
  }

  const changeColor = (data.change_pct ?? 0) >= 0 ? "#00ff88" : "#ff4444";
  const changeSign = (data.change_pct ?? 0) >= 0 ? "+" : "";

  return (
    <div>
      {/* Back link */}
      <a
        href="/stocks"
        style={{
          color: "var(--muted)",
          fontSize: "0.875rem",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 16,
        }}
      >
        ← Cours
      </a>

      {/* Title row */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--green)",
                fontFamily: "monospace",
                letterSpacing: "-0.02em",
              }}
            >
              {data.ticker}
            </h1>
            {data.sector && (
              <span
                style={{
                  padding: "2px 10px",
                  borderRadius: 20,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontSize: "0.75rem",
                }}
              >
                {data.sector}
              </span>
            )}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
            {data.companyName}
          </p>
        </div>

        {/* Price + change */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              fontFamily: "monospace",
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            {data.last > 0
              ? data.last.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
              : "—"}
            <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 400 }}>
              {" "}
              F
            </span>
          </div>
          {data.change_pct !== null && (
            <div style={{ color: changeColor, fontSize: "0.9rem", fontWeight: 600 }}>
              {changeSign}
              {data.change_pct.toFixed(2)}%
              <span style={{ fontSize: "0.8rem", marginLeft: 6, color: "var(--muted)", fontWeight: 400 }}>
                aujourd&apos;hui
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <a
          href={`/watchlist?ticker=${data.ticker}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            fontSize: "0.85rem",
            textDecoration: "none",
            cursor: "pointer",
            transition: "border-color 0.15s",
          }}
        >
          <span>♡</span>
          <span>Ajouter à la Watchlist</span>
        </a>
        <a
          href={`/alertes?ticker=${data.ticker}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            fontSize: "0.85rem",
            textDecoration: "none",
            cursor: "pointer",
            transition: "border-color 0.15s",
          }}
        >
          <span>🔔</span>
          <span>Créer une Alerte</span>
        </a>
      </div>

      {/* 2-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
        }}
      >
        {/* LEFT — Chart + Analyse Technique */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Chart */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <StockChart
              ticker={data.ticker}
              history={data.history}
              mm20={data.mm20}
              mm50={data.mm50}
              macd={data.macd}
              macdSignal={data.macdSignal}
              macdHistogram={data.macdHistogram}
            />
          </div>

          {/* Analyse Technique — swapped here */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <StockTechnicals ticker={data.ticker} />
          </div>

          {/* Calendrier corporate */}
          <StockCorporate ticker={data.ticker} cours={data.last} />
        </div>

        {/* RIGHT — Informations + MM + Statistiques */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Company info */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Informations
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Symbole", data.ticker],
                ["Entreprise", data.companyName],
                ["Secteur", data.sector || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MM Panel */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Moyennes Mobiles
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <MMRow
                label="MM20"
                color="#f59e0b"
                value={
                  data.mm20.length > 0
                    ? data.mm20[data.mm20.length - 1].value
                    : null
                }
                last={data.last}
              />
              <MMRow
                label="MM50"
                color="#8b5cf6"
                value={
                  data.mm50.length > 0
                    ? data.mm50[data.mm50.length - 1].value
                    : null
                }
                last={data.last}
              />
            </div>
            {data.mm20.length > 0 && data.mm50.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "#0f1a14",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                {SignalText(data)}
              </div>
            )}
          </div>

          {/* Statistiques — swapped here */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Statistiques
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Dernier cours", data.last ? `${data.last.toLocaleString("fr-FR")} F` : "—"],
                  ["Variation jour", data.change_pct !== null ? `${changeSign}${data.change_pct.toFixed(2)}%` : "—"],
                  ["Var. 7 jours", data.var_7d !== null ? `${data.var_7d >= 0 ? "+" : ""}${data.var_7d.toFixed(2)}%` : "—"],
                  ["Var. 30 jours", data.var_30d !== null ? `${data.var_30d >= 0 ? "+" : ""}${data.var_30d.toFixed(2)}%` : "—"],
                  ["Plus haut (27j)", data.high ? `${data.high.toLocaleString("fr-FR")} F` : "—"],
                  ["Plus bas (27j)", data.low && data.low !== Infinity ? `${data.low.toLocaleString("fr-FR")} F` : "—"],
                  ["Volume", data.volume ? data.volume.toLocaleString("fr-FR") : "—"],
                ].map(([label, value], i) => (
                  <tr
                    key={label}
                    style={{ borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}
                  >
                    <td style={{ padding: "8px 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                      {label}
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MMRow({
  label,
  color,
  value,
  last,
}: {
  label: string;
  color: string;
  value: number | null;
  last: number;
}) {
  if (value === null)
    return (
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 2,
              background: color,
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{label}</span>
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>—</span>
      </div>
    );

  const diff = last - value;
  const diffPct = (diff / value) * 100;
  const diffColor = diff >= 0 ? "#00ff88" : "#ff4444";

  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-2">
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: color,
          }}
        />
        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{label}</span>
      </span>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
          {value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} F
        </div>
        <div style={{ fontSize: "0.75rem", color: diffColor }}>
          {diff >= 0 ? "+" : ""}
          {diffPct.toFixed(2)}% vs cours
        </div>
      </div>
    </div>
  );
}

function SignalText(data: StockDetail): string {
  const last = data.last;
  const mm20 =
    data.mm20.length > 0 ? data.mm20[data.mm20.length - 1].value : null;
  const mm50 =
    data.mm50.length > 0 ? data.mm50[data.mm50.length - 1].value : null;

  if (!mm20 || !mm50) return "Données insuffisantes pour un signal.";
  if (last > mm20 && last > mm50) return `📈 Tendance haussière — ${data.ticker} au-dessus des MM20 et MM50.`;
  if (last < mm20 && last < mm50) return `📉 Tendance baissière — ${data.ticker} en dessous des MM20 et MM50.`;
  if (last > mm20 && last < mm50) return `↗️ ${data.ticker} au-dessus de la MM20 mais sous la MM50 — attention.`;
  if (last < mm20 && last > mm50) return `↘️ ${data.ticker} sous la MM20 mais au-dessus de la MM50 — surveillé.`;
  return "↔️ Signal neutre.";
}
