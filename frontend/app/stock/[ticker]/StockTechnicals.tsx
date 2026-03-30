"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Technicals {
  ticker: string;
  date: string;
  cours: number;
  variationJour: number;
  rsi14: number | null;
  mm10: number | null;
  mm20: number | null;
  mm50: number | null;
  support30: number | null;
  resistance30: number | null;
  support252: number | null;
  resistance252: number | null;
  var7j: number | null;
  var30j: number | null;
  signal: string;
  vsMm10: number | null;
  vsMm20: number | null;
  vsMm50: number | null;
  nbJours: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const d = dateStr.slice(6, 8);
  const m = dateStr.slice(4, 6);
  const y = dateStr.slice(0, 4);
  return `${d}/${m}/${y}`;
}

function Badge({
  label,
  color,
  bg,
  fontSize = "0.7rem",
}: {
  label: string;
  color: string;
  bg: string;
  fontSize?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        background: bg,
        color,
        fontWeight: 700,
        fontSize,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
      }}
    >
      {label}
    </span>
  );
}

function VarBadge({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>—</span>;
  const pos = value >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 10px",
        borderRadius: 8,
        background: pos ? "rgba(0,255,136,0.1)" : "rgba(255,68,68,0.1)",
        color: pos ? "#00ff88" : "#ff4444",
        fontWeight: 700,
        fontSize: "0.85rem",
        fontFamily: "monospace",
      }}
    >
      {pos ? "↑" : "↓"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function RSIChart({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--muted)" }}>—</span>;
  const pct = Math.min(100, Math.max(0, value));
  const color =
    value > 70 ? "#ff4444" : value < 30 ? "#00ff88" : "#f59e0b";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            height: 10,
            borderRadius: 5,
            background: "#1a2a22",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Zone colors */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "30%",
              background: "rgba(0,255,136,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "30%",
              background: "rgba(255,68,68,0.08)",
            }}
          />
          {/* Fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${pct}%`,
              background: color,
              borderRadius: 5,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        {/* Zone labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 3,
            fontSize: "0.65rem",
            color: "var(--muted)",
          }}
        >
          <span style={{ color: "#00ff88" }}>0</span>
          <span>30</span>
          <span>70</span>
          <span style={{ color: "#ff4444" }}>100</span>
        </div>
      </div>
      <span
        style={{
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: "1.1rem",
          color,
          minWidth: 48,
          textAlign: "right",
        }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function SupportResistance({
  cours,
  support30,
  resistance30,
}: {
  cours: number;
  support30: number | null;
  resistance30: number | null;
}) {
  if (!support30 || !resistance30) {
    return <span style={{ color: "var(--muted)" }}>—</span>;
  }
  const range = resistance30 - support30;
  if (range <= 0) return <span style={{ color: "var(--muted)" }}>—</span>;

  const supportPct = Math.max(0, Math.min(100, ((cours - support30) / range) * 100));

  return (
    <div style={{ position: "relative" }}>
      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#00ff88" }}>
          Support {support30.toLocaleString("fr-FR")} F
        </span>
        <span style={{ color: "#ff4444" }}>
          Résist. {resistance30.toLocaleString("fr-FR")} F
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: "linear-gradient(to right, rgba(0,255,136,0.3), rgba(255,68,68,0.3))",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Support zone */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background:
              "repeating-linear-gradient(to right, rgba(0,255,136,0.2) 0px, rgba(0,255,136,0.2) 4px, transparent 4px, transparent 8px)",
            borderRadius: 5,
          }}
        />
        {/* Resistance zone */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background:
              "repeating-linear-gradient(to left, rgba(255,68,68,0.2) 0px, rgba(255,68,68,0.2) 4px, transparent 4px, transparent 8px)",
            borderRadius: 5,
          }}
        />
        {/* Course marker */}
        <div
          style={{
            position: "absolute",
            left: `calc(${supportPct}% - 6px)`,
            top: "50%",
            transform: "translateY(-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#00ff88",
            border: "2px solid #0f0f1a",
            zIndex: 2,
            boxShadow: "0 0 8px rgba(0,255,136,0.6)",
          }}
        />
      </div>

      {/* Distance labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: "0.7rem",
          color: "var(--muted)",
        }}
      >
        <span style={{ color: "#00ff88" }}>
          -{(( (cours - support30) / support30) * 100).toFixed(1)}%
        </span>
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {cours.toLocaleString("fr-FR")} F
        </span>
        <span style={{ color: "#ff4444" }}>
          +{(((resistance30 - cours) / cours) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function signalBadge(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("ACHAT") || s.includes("SURV")) {
    return <Badge label={signal} color="#00ff88" bg="rgba(0,255,136,0.12)" />;
  }
  if (s.includes("VENTE") || s.includes("SURACH")) {
    return <Badge label={signal} color="#ff4444" bg="rgba(255,68,68,0.12)" />;
  }
  return <Badge label={signal} color="#9ca3af" bg="rgba(156,163,175,0.12)" />;
}

interface Props {
  ticker: string;
}

export default function StockTechnicals({ ticker }: Props) {
  const [data, setData] = useState<Technicals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stocks/${ticker}/technicals`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e: Error) => setError(e.message || "Erreur chargement"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 120,
          color: "var(--muted)",
          fontSize: "0.875rem",
        }}
      >
        Chargement indicateurs techniques…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: "16px",
          color: "#ff4444",
          fontSize: "0.875rem",
          textAlign: "center",
        }}
      >
        Erreur chargement technicals: {error || "données indisponibles"}
      </div>
    );
  }

  const insufficient = data.nbJours < 30;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Analyse Technique
          </span>
          {signalBadge(data.signal)}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
          Données: {data.nbJours} jours · {formatDate(data.date)}
        </div>
      </div>

      {/* Données insuffisantes warning */}
      {insufficient && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 8,
            fontSize: "0.8rem",
            color: "#f59e0b",
          }}
        >
          ⚠️ Données insuffisantes pour les indicateurs longs termes (MM50, var30j)
        </div>
      )}

      {/* RSI 14 */}
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          RSI 14
        </div>
        <RSIChart value={data.rsi14} />
        <div
          style={{
            marginTop: 4,
            fontSize: "0.72rem",
            color: "var(--muted)",
          }}
        >
          {data.rsi14 !== null
            ? data.rsi14 > 70
              ? "Suracheté — possible retournement baissier"
              : data.rsi14 < 30
              ? "Survendu — possible rebond technique"
              : "Zone neutre"
            : "—"}
        </div>
      </div>

      {/* Moyennes Mobiles */}
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Moyennes Mobiles
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              label: "MM10",
              color: "#60a5fa",
              value: data.mm10,
              vs: data.vsMm10,
            },
            {
              label: "MM20",
              color: "#f59e0b",
              value: data.mm20,
              vs: data.vsMm20,
            },
            {
              label: "MM50",
              color: "#8b5cf6",
              value: data.mm50,
              vs: data.vsMm50,
              dim: insufficient,
            },
          ].map(({ label, color, value, vs, dim }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: dim ? 0.4 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: color,
                  }}
                />
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {label}
                </span>
              </div>
              {value !== null ? (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} F
                  </div>
                  {vs !== null && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: vs >= 0 ? "#00ff88" : "#ff4444",
                      }}
                    >
                      {vs >= 0 ? "+" : ""}
                      {vs.toFixed(2)}% vs cours
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--muted)" }}>
                  —
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Supports & Résistances 30j */}
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Supports &amp; Résistances (30j)
        </div>
        <SupportResistance
          cours={data.cours}
          support30={data.support30}
          resistance30={data.resistance30}
        />
      </div>

      {/* var7j / var30j */}
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
          }}
        >
          Performances
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 4 }}>
              7 jours
            </div>
            <VarBadge value={data.var7j} />
          </div>
          <div style={{ flex: 1, opacity: insufficient ? 0.4 : 1 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 4 }}>
              30 jours
            </div>
            <VarBadge value={insufficient ? null : data.var30j} />
          </div>
        </div>
      </div>

      {/* Back link */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <Link
          href="/stocks"
          style={{
            color: "var(--muted)",
            fontSize: "0.8rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            transition: "color 0.15s",
          }}
        >
          ← Retour à la liste
        </Link>
      </div>
    </div>
  );
}
