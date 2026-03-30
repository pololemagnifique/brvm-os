"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:3000/api";
const EOD_PATH = "/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json";

interface Stock {
  ticker: string;
  last: number | null;
  change_pct: number | null;
  var_7d: number | null;
  var_30d: number | null;
  volume: number | null;
}

interface WatchlistItem {
  id: string;
  ticker: string;
  companyName?: string;
  sector?: string;
  last: number | null;
  change_pct: number | null;
  var_7d: number | null;
  var_30d: number | null;
  volume: number | null;
  addedAt: string;
}

interface Watchlist {
  id: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

// Load EOD prices for tickers
async function loadPrices(tickers: string[]): Promise<Record<string, Stock>> {
  try {
    const fs = await import("fs");
    const raw = fs.readFileSync(EOD_PATH, "utf-8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : (data.stocks || []);
    const map: Record<string, Stock> = {};
    for (const s of list) {
      if (s && s.ticker && tickers.includes(s.ticker)) {
        map[s.ticker] = {
          ticker: s.ticker,
          last: s.last ?? null,
          change_pct: s.change_pct ?? null,
          var_7d: s.var_7d ?? null,
          var_30d: s.var_30d ?? null,
          volume: s.volume ?? null,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}

// Load all stocks for the picker
async function loadAllStocks(): Promise<Array<{ ticker: string; companyName: string; sector?: string }>> {
  try {
    const res = await fetch(`${API}/stocks`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export default function WatchlistClient() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("laurent@test.brvm");
  const [loginError, setLoginError] = useState("");
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selected, setSelected] = useState<Watchlist | null>(null);
  const [allStocks, setAllStocks] = useState<Array<{ ticker: string; companyName: string; sector?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTickers, setNewTickers] = useState<string[]>([]);
  const [detailTicker, setDetailTicker] = useState("");
  const [detailName, setDetailName] = useState("");
  const [error, setError] = useState("");

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem("brvm_token");
    if (stored) {
      setToken(stored);
    } else {
      setLoading(false);
    }
  }, []);

  // Load data once authenticated
  useEffect(() => {
    if (!token) return;
    Promise.all([fetchWatchlists(), loadAllStocks().then(setAllStocks)]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchWatchlists(): Promise<Watchlist[]> {
    const res = await fetch(`${API}/watchlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.removeItem("brvm_token");
      setToken(null);
      return [];
    }
    if (!res.ok) throw new Error("Erreur chargement watchlists");
    const data: Watchlist[] = await res.json();
    // Enrich items with EOD prices
    const tickers = data.flatMap((wl) => wl.items.map((i) => i.ticker));
    const prices = await loadPrices(tickers);
    const enriched = data.map((wl) => ({
      ...wl,
      items: wl.items.map((item) => {
        const p = prices[item.ticker] || {};
        return {
          ...item,
          companyName: (item as any).stock?.companyName || (item as any).stock?.company_name || "",
          sector: (item as any).stock?.sector || "",
          last: p.last ?? null,
          change_pct: p.change_pct ?? null,
          var_7d: p.var_7d ?? null,
          var_30d: p.var_30d ?? null,
          volume: p.volume ?? null,
        };
      }),
    }));
    setWatchlists(enriched);
    return enriched;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de connexion");
      localStorage.setItem("brvm_token", data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/watchlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), tickers: newTickers }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur création");
      }
      setNewName("");
      setNewTickers([]);
      setShowCreate(false);
      await fetchWatchlists();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(wl: Watchlist) {
    if (!confirm(`Supprimer "${wl.name}" ?`)) return;
    await fetch(`${API}/watchlists/${wl.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (selected?.id === wl.id) { setSelected(null); setShowDetail(false); }
    await fetchWatchlists();
  }

  async function handleRename(wl: Watchlist) {
    const name = prompt(`Nouveau nom pour "${wl.name}" :`, wl.name);
    if (!name || name === wl.name) return;
    await fetch(`${API}/watchlists/${wl.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    if (selected?.id === wl.id) setSelected((s) => s ? { ...s, name } : s);
    await fetchWatchlists();
  }

  async function openDetail(wl: Watchlist) {
    setSelected(wl);
    setDetailName(wl.name);
    setShowDetail(true);
  }

  async function handleAddTicker(e: React.FormEvent) {
    e.preventDefault();
    if (!detailTicker.trim() || !selected) return;
    const ticker = detailTicker.trim().toUpperCase();
    setDetailTicker("");
    const res = await fetch(`${API}/watchlists/${selected.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ticker }),
    });
    if (res.ok) {
      const enriched = await fetchWatchlists();
      const updated = enriched.find((w) => w.id === selected.id);
      if (updated) setSelected(updated);
    }
  }

  async function handleRemoveTicker(ticker: string) {
    if (!selected) return;
    await fetch(`${API}/watchlists/${selected.id}/items/${ticker}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const enriched = await fetchWatchlists();
    const updated = enriched.find((w) => w.id === selected.id);
    if (updated) setSelected(updated);
  }

  async function handleDetailRename() {
    if (!selected || !detailName.trim()) return;
    await fetch(`${API}/watchlists/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: detailName.trim() }),
    });
    setSelected((s) => s ? { ...s, name: detailName.trim() } : s);
    await fetchWatchlists();
  }

  function toggleTicker(ticker: string) {
    setNewTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  }

  if (!token) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ background: "#1a2a22", border: "1px solid #2d3d32", borderRadius: 12, padding: "40px 48px", maxWidth: 400, width: "100%" }}>
          <h2 style={{ color: "#00ff88", marginBottom: 8, fontSize: "1.4rem" }}>Connexion</h2>
          <p style={{ color: "#6b7280", marginBottom: 24, fontSize: "0.85rem" }}>Accès à votre espace watchlist</p>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: 6 }}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            {loginError && <p style={{ color: "#ff4444", fontSize: "0.85rem", marginBottom: 16 }}>{loginError}</p>}
            <button type="submit" style={{ ...btnStyle, width: "100%", background: "#00ff88", color: "#0a0f0d", fontWeight: 700 }}>
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", color: "#fff", minHeight: "100vh", background: "#0a0f0d" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#00ff88", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Watchlists</h1>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "4px 0 0" }}>
            {watchlists.length} watchlist{watchlists.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); setNewName(""); setNewTickers([]); }}
          style={{ ...btnStyle, background: "#00ff88", color: "#0a0f0d", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: "1.1rem" }}>+</span> Nouvelle watchlist
        </button>
      </div>

      {/* Loading */}
      {loading && <p style={{ color: "#6b7280" }}>Chargement...</p>}

      {/* Empty state */}
      {!loading && watchlists.length === 0 && (
        <div style={{ background: "#1a2a22", border: "1px solid #2d3d32", borderRadius: 12, padding: "48px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>Aucune watchlist pour le moment</p>
          <button onClick={() => setShowCreate(true)} style={{ ...btnStyle, background: "#00ff88", color: "#0a0f0d", fontWeight: 700 }}>
            Créer ma première watchlist
          </button>
        </div>
      )}

      {/* Watchlist cards */}
      {!loading && watchlists.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {watchlists.map((wl) => (
            <div
              key={wl.id}
              style={{ background: "#1a2a22", border: "1px solid #2d3d32", borderRadius: 12, padding: 20, cursor: "pointer", transition: "border-color 0.2s" }}
              onClick={() => openDetail(wl)}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#00ff88")}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2d3d32")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ color: "#fff", fontSize: "1rem", fontWeight: 600, margin: 0 }}>{wl.name}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRename(wl); }}
                    style={{ ...iconBtn, color: "#9ca3af" }}
                    title="Renommer"
                  >✎</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(wl); }}
                    style={{ ...iconBtn, color: "#ff4444" }}
                    title="Supprimer"
                  >✕</button>
                </div>
              </div>
              <p style={{ color: "#6b7280", fontSize: "0.8rem", margin: "0 0 12px" }}>
                {wl.items.length} titre{wl.items.length !== 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {wl.items.slice(0, 6).map((item) => (
                  <span key={item.ticker} style={{ background: "#0f1a14", border: "1px solid #2d3d32", borderRadius: 6, padding: "3px 8px", fontSize: "0.75rem", fontFamily: "monospace", color: "#00ff88" }}>
                    {item.ticker}
                  </span>
                ))}
                {wl.items.length > 6 && (
                  <span style={{ color: "#6b7280", fontSize: "0.75rem", padding: "3px 4px" }}>+{wl.items.length - 6}</span>
                )}
                {wl.items.length === 0 && (
                  <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>vide</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Nouvelle watchlist" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: 6 }}>Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Banques, Tech, Énergie..."
                style={inputStyle}
                required
                autoFocus
              />
            </div>
            {error && <p style={{ color: "#ff4444", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#9ca3af", fontSize: "0.8rem", marginBottom: 8 }}>
                Titres ({newTickers.length} sélectionné{newTickers.length !== 1 ? "s" : ""})
              </label>
              <div style={{ background: "#0f1a14", border: "1px solid #2d3d32", borderRadius: 8, padding: 12, maxHeight: 220, overflowY: "auto" }}>
                {allStocks.length === 0 && <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Chargement des titres...</p>}
                {allStocks.map((s) => {
                  const checked = newTickers.includes(s.ticker);
                  return (
                    <label
                      key={s.ticker}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid #1a2a22" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTicker(s.ticker)}
                        style={{ accentColor: "#00ff88", width: 15, height: 15 }}
                      />
                      <span style={{ fontFamily: "monospace", color: "#00ff88", fontSize: "0.8rem", fontWeight: 700, minWidth: 50 }}>{s.ticker}</span>
                      <span style={{ color: "#9ca3af", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.companyName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ ...btnStyle, background: "transparent", border: "1px solid #2d3d32", color: "#9ca3af" }}>
                Annuler
              </button>
              <button type="submit" disabled={creating} style={{ ...btnStyle, background: "#00ff88", color: "#0a0f0d", fontWeight: 700 }}>
                {creating ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <Modal title="" onClose={() => setShowDetail(false)} wide>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <input
                type="text"
                value={detailName}
                onChange={(e) => setDetailName(e.target.value)}
                onBlur={handleDetailRename}
                style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: 700, background: "transparent", border: "none", borderBottom: "1px solid #2d3d32", borderRadius: 0, padding: "4px 0", color: "#fff", flex: 1 }}
              />
              <span style={{ color: "#6b7280", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                {selected.items.length} titre{selected.items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Add ticker form */}
            <form onSubmit={handleAddTicker} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                type="text"
                value={detailTicker}
                onChange={(e) => setDetailTicker(e.target.value.toUpperCase())}
                placeholder="Symbole (ex: ORAC)"
                style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
                maxLength={10}
              />
              <button type="submit" style={{ ...btnStyle, background: "#00ff88", color: "#0a0f0d", fontWeight: 700, whiteSpace: "nowrap" }}>
                + Ajouter
              </button>
            </form>

            {/* Tickers table */}
            {selected.items.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "32px 0" }}>Aucun titre dans cette watchlist</p>
            ) : (
              <div style={{ overflowX: "auto", background: "#0f1a14", borderRadius: 8, border: "1px solid #2d3d32" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #2d3d32" }}>
                      {["Symbole", "Entreprise", "Dernier", "Var.", "Var. 7j", "Vol.", ""].map((h, i) => (
                        <th key={i} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#6b7280", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => {
                      const v = item.change_pct ?? 0;
                      return (
                        <tr key={item.ticker} style={{ borderBottom: "1px solid #1a2a22" }}>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#00ff88", fontWeight: 700 }}>{item.ticker}</td>
                          <td style={{ padding: "10px 12px", color: "#e5e7eb", fontSize: "0.85rem" }}>
                            {item.companyName || (item as any).stock?.companyName || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", textAlign: "right", color: "#fff" }}>
                            {item.last != null ? item.last.toLocaleString("fr-FR") + " F" : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", textAlign: "right", color: v >= 0 ? "#00ff88" : "#ff4444" }}>
                            {item.change_pct != null ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", textAlign: "right", color: (item.var_7d ?? 0) >= 0 ? "#00ff88" : "#ff4444", fontSize: "0.8rem" }}>
                            {item.var_7d != null ? ((item.var_7d >= 0 ? "+" : "") + item.var_7d.toFixed(2) + "%") : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", textAlign: "right", color: "#9ca3af", fontSize: "0.8rem" }}>
                            {item.volume != null ? item.volume.toLocaleString("fr-FR") : "—"}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              onClick={() => handleRemoveTicker(item.ticker)}
                              style={{ ...iconBtn, color: "#ff4444", fontSize: "0.8rem" }}
                              title="Retirer"
                            >✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Shared components ---

function Modal({ title, children, onClose, wide }: { title?: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#1a2a22", border: "1px solid #2d3d32", borderRadius: 12, padding: "28px 32px", width: "100%", maxWidth: wide ? 700 : 480 }}>
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#00ff88", fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ ...iconBtn, color: "#9ca3af", fontSize: "1rem" }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f1a14",
  border: "1px solid #2d3d32",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#fff",
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  transition: "opacity 0.15s",
};

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: "4px",
  borderRadius: 4,
  lineHeight: 1,
};
