"use client";

import Link from "next/link";

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

export default function StockRow({ s }: { s: Stock }) {
  const v7 = s.var_7d ?? 0;
  const v30 = s.var_30d ?? 0;

  return (
    <tr
      style={{ borderBottom: "1px solid #1a2a22", cursor: "pointer", transition: "background 0.15s" }}
      onClick={() => (window.location.href = `/stock/${s.ticker}`)}
      onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = "#1a2a22")}
      onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#00ff88", fontWeight: 700, fontSize: "0.9rem" }}>
        {s.ticker}
      </td>
      <td style={{ padding: "10px 12px", fontSize: "0.875rem" }}>{s.companyName}</td>
      <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: "0.8rem" }}>{s.sector || "—"}</td>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem" }}>
        {s.last != null ? s.last.toLocaleString("fr-FR") + " F" : "—"}
      </td>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem", color: v7 >= 0 ? "#00ff88" : "#ff4444" }}>
        {s.var_7d != null ? (v7 >= 0 ? "+" : "") + v7.toFixed(2) + "%" : "—"}
      </td>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "0.875rem", color: v30 >= 0 ? "#00ff88" : "#ff4444" }}>
        {s.var_30d != null ? (v30 >= 0 ? "+" : "") + v30.toFixed(2) + "%" : "—"}
      </td>
      <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#9ca3af", fontSize: "0.8rem" }}>
        {s.volume != null ? s.volume.toLocaleString("fr-FR") : "—"}
      </td>
    </tr>
  );
}
