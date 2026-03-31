"use client";

import { useEffect, useState } from "react";

interface DividendEntry {
  exercice: number;
  montant_net: number | null;
  date_paiement: string | null;
  date_ex_dividende: string | null;
  source: string;
}

interface CorporateData {
  ticker: string;
  dividendes: DividendEntry[];
  ags: any[];
  error?: string;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

function RendementBadge({ montant, cours }: { montant: number; cours: number }) {
  if (!cours) return null;
  const rend = (montant / cours) * 100;
  const pos = rend > 0;
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "0.78rem",
        fontWeight: 700,
        color: pos ? "#00ff88" : "#ff4444",
      }}
    >
      {pos ? "+" : ""}{rend.toFixed(2)}%
    </span>
  );
}

export default function StockCorporate({ ticker, cours }: { ticker: string; cours: number }) {
  const [data, setData] = useState<CorporateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stocks/${ticker}/corporate`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        Chargement calendrier corporate…
      </div>
    );
  }

  if (!data || data.error || data.dividendes.length === 0) {
    return (
      <div style={{ padding: "16px", color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>
        {data?.error || "Aucune donnée corporate disponible pour ce titre"}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          📅 Calendrier Corporate
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
          Source : brvm.org
        </span>
      </div>

      {/* Dividendes table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Exercice", "Montant net", "Rendement", "Date detachment", "Date paiement"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "4px 8px",
                    color: "var(--muted)",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.dividendes.map((div, i) => (
              <tr
                key={div.exercice}
                style={{
                  borderBottom: i < data.dividendes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                }}
              >
                <td style={{ padding: "8px 8px", fontFamily: "monospace", fontWeight: 600 }}>
                  {div.exercice}
                </td>
                <td style={{ padding: "8px 8px", fontFamily: "monospace", fontWeight: 700, color: div.montant_net ? "#00ff88" : "var(--muted)" }}>
                  {div.montant_net ? `${div.montant_net.toLocaleString("fr-FR")} F` : "—"}
                </td>
                <td style={{ padding: "8px 8px" }}>
                  {div.montant_net && cours ? (
                    <RendementBadge montant={div.montant_net} cours={cours} />
                  ) : (
                    <span style={{ color: "var(--muted)" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "8px 8px", fontFamily: "monospace", color: "var(--muted)" }}>
                  {formatDate(div.date_ex_dividende)}
                </td>
                <td style={{ padding: "8px 8px", fontFamily: "monospace", color: "var(--muted)" }}>
                  {formatDate(div.date_paiement)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legende */}
      <div style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "right" }}>
        * Rendement = dividende net / cours actuel × 100
      </div>
    </div>
  );
}
