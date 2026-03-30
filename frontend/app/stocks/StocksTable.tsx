"use client";

import { useState, useMemo } from "react";

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

type SortKey = keyof Stock;
type SortDir = "asc" | "desc";

const COLS: { key: SortKey | "fiche"; label: string }[] = [
  { key: "ticker", label: "Symbole" },
  { key: "companyName", label: "Entreprise" },
  { key: "sector", label: "Secteur" },
  { key: "last", label: "Dernier" },
  { key: "var_7d", label: "Var 7j" },
  { key: "var_30d", label: "Var 30j" },
  { key: "volume", label: "Volume" },
  { key: "fiche", label: "Fiche" },
];

export default function StocksTable({ stocks }: { stocks: Stock[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [stocks, sortKey, sortDir]);

  return (
    <div style={{ overflowX: "auto", background: "#1a2a22", borderRadius: 12, border: "1px solid #2d3d32" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #2d3d32" }}>
            {COLS.map(({ key, label }) => (
              <th
                key={key}
                onClick={() => key !== "fiche" && handleSort(key as SortKey)}
                style={{
                  padding: "12px 14px",
                  textAlign: key === "last" || key === "var_7d" || key === "var_30d" || key === "volume" ? "right" : "left",
                  color: sortKey === key ? "#00ff88" : "#6b7280",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  cursor: key === "fiche" ? "default" : "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
                {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const v7 = s.var_7d ?? 0;
            const v30 = s.var_30d ?? 0;
            return (
              <tr
                key={s.ticker}
                style={{ borderBottom: "1px solid #1a2a22", transition: "background 0.15s" }}
                onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = "#1a2a22")}
                onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#00ff88", fontWeight: 700, fontSize: "0.9rem" }}>
                  {s.ticker}
                </td>
                <td style={{ padding: "10px 12px", fontSize: "0.875rem" }}>{s.companyName}</td>
                <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: "0.8rem" }}>{s.sector || "—"}</td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem", textAlign: "right" }}>
                  {s.last != null ? s.last.toLocaleString("fr-FR") + " F" : "—"}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem", color: v7 >= 0 ? "#00ff88" : "#ff4444", textAlign: "right" }}>
                  {s.var_7d != null ? (v7 >= 0 ? "+" : "") + v7.toFixed(2) + "%" : "—"}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem", color: v30 >= 0 ? "#00ff88" : "#ff4444", textAlign: "right" }}>
                  {s.var_30d != null ? (v30 >= 0 ? "+" : "") + v30.toFixed(2) + "%" : "—"}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#9ca3af", fontSize: "0.8rem", textAlign: "right" }}>
                  {s.volume != null ? s.volume.toLocaleString("fr-FR") : "—"}
                </td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>
                  <button
                    onClick={() => (window.location.href = `/stocks/${s.ticker}`)}
                    style={{
                      padding: "4px 12px",
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.35)",
                      borderRadius: 6,
                      color: "#f59e0b",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Fiche Valeur
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
