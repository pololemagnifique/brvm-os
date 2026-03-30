'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TechData {
  ticker: string;
  date: string;
  cours: number;
  variationJour: number;
  rsi14: number;
  mm10: number | null;
  mm20: number | null;
  mm50: number | null;
  support30: number;
  resistance30: number;
  support252: number;
  resistance252: number;
  var7j: number | null;
  var30j: number | null;
  signal: string;
  vsMm10: number | null;
  vsMm20: number | null;
  vsMm50: number | null;
  nbJours: number;
  error?: string;
}

interface StockInfo {
  ticker: string;
  companyName: string;
  sector: string;
}

function fmt(n: number | null) {
  if (n === null) return '—';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function pct(n: number | null) {
  if (n === null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function rsiColor(rsi: number) {
  if (rsi >= 70) return { bar: 'bg-red-500', text: 'text-red-400', label: 'SURACHAT' };
  if (rsi <= 30) return { bar: 'bg-green-500', text: 'text-green-400', label: 'SURVente' };
  if (rsi < 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Neutre' };
  return { bar: 'bg-blue-500', text: 'text-blue-400', label: 'Neutre' };
}

function signalBadge(signal: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ACHAT:     { bg: 'bg-green-600', text: 'text-white', label: 'ACHAT ↑' },
    SURVente:  { bg: 'bg-green-700', text: 'text-white', label: 'SURVente ↑' },
    VENTE:     { bg: 'bg-red-600', text: 'text-white', label: 'VENTE ↓' },
    SURACHAT:  { bg: 'bg-red-700', text: 'text-white', label: 'SURACHAT ↓' },
    NEUTRE:    { bg: 'bg-gray-600', text: 'text-white', label: 'Neutre' },
  };
  const s = map[signal] ?? map['NEUTRE'];
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function VariationBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-gray-500 text-sm">{label} : —</span>;
  const up = value >= 0;
  return (
    <span className={`text-sm font-mono px-2 py-0.5 rounded ${up ? 'text-green-400' : 'text-red-400'}`}>
      {label} : {up ? '↑' : '↓'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function SupportBar({ support, resistance, cours }: { support: number; resistance: number; cours: number }) {
  const total = resistance - support;
  const pos = total > 0 ? Math.min(100, Math.max(0, ((cours - support) / total) * 100)) : 50;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Support {support.toLocaleString('fr-FR')}</span>
        <span>Résistance {resistance.toLocaleString('fr-FR')}</span>
      </div>
      <div className="w-full h-3 rounded bg-red-900/50 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-green-500 rounded transition-all"
          style={{ width: `${pos}%` }}
        />
        <div
          className="absolute top-0 w-0.5 h-full bg-white"
          style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  );
}

function RsiGauge({ value }: { value: number }) {
  const { bar, text } = rsiColor(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>0</span>
        <span className={`font-bold text-sm ${text}`}>{value.toFixed(1)}</span>
        <span>100</span>
      </div>
      <div className="w-full h-3 rounded bg-gray-800 relative overflow-hidden">
        <div className={`h-full ${bar} transition-all`} style={{ width: `${value}%` }} />
        <div className="absolute top-0 left-0 w-0.5 h-full bg-white/50" />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Survente 30</span>
        <span>Surachat 70</span>
      </div>
    </div>
  );
}

export default function FicheValeurClient({ ticker }: { ticker: string }) {
  const [tech, setTech] = useState<TechData | null>(null);
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = ticker.toUpperCase();
    Promise.all([
      fetch(`/api/stocks/${t}/technicals`).then(r => r.json()),
      fetch(`/api/stocks/${t}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([tData, sData]) => {
      setTech(tData);
      setStock(sData);
      setLoading(false);
    });
  }, [ticker]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!tech || tech.error) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">Données techniques indisponibles pour {ticker}</div>
        <Link href="/stocks" className="text-blue-400 hover:underline">← Retour aux actions</Link>
      </div>
    );
  }

  const insufficient = tech.nbJours < 30;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/stocks" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
          ← Liste
        </Link>
        <div className="text-right">
          <div className="text-2xl font-bold">{tech.ticker}</div>
          <div className="text-sm text-gray-400">{stock?.companyName ?? '—'}</div>
        </div>
      </div>

      {/* Cours + Signal */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{tech.cours.toLocaleString('fr-FR')} <span className="text-lg text-gray-400">XOF</span></div>
          <div className={`text-sm font-mono mt-1 ${tech.variationJour >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {tech.variationJour >= 0 ? '↑' : '↓'} {Math.abs(tech.variationJour).toFixed(2)}% aujourd'hui
          </div>
          <div className="text-xs text-gray-500 mt-1">Date : {tech.date}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {signalBadge(tech.signal)}
          <div className="text-xs text-gray-500">Signal</div>
        </div>
      </div>

      {/* RSI */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
        <div className="text-sm font-semibold text-gray-300 mb-3">RSI 14</div>
        <RsiGauge value={tech.rsi14} />
      </div>

      {/* Moyennes Mobiles */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
        <div className="text-sm font-semibold text-gray-300 mb-3">Moyennes Mobiles</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'MM10', value: tech.mm10, vs: tech.vsMm10 },
            { label: 'MM20', value: tech.mm20, vs: tech.vsMm20 },
            { label: 'MM50', value: tech.mm50, vs: tech.vsMm50 },
          ].map(({ label, value, vs }) => (
            <div key={label} className="bg-[#0f0f1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="text-lg font-bold">{fmt(value)}</div>
              <div className={`text-xs font-mono ${(vs ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pct(vs)} vs cours
              </div>
            </div>
          ))}
        </div>
        {insufficient && (
          <div className="mt-3 text-xs text-yellow-500 bg-yellow-900/20 rounded p-2 border border-yellow-800">
            ⚠️ Données insuffisantes pour MM50 et var30j ({tech.nbJours} jours — minimum 30 requis)
          </div>
        )}
      </div>

      {/* Supports / Résistances */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
        <div className="text-sm font-semibold text-gray-300 mb-3">Supports & Résistances</div>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">30 jours</div>
            <SupportBar support={tech.support30} resistance={tech.resistance30} cours={tech.cours} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-center">
            <div className="bg-[#0f0f1a] rounded p-2">
              <div className="text-xs text-gray-500">Support Max</div>
              <div className="text-green-400 font-bold">{tech.support252.toLocaleString('fr-FR')}</div>
            </div>
            <div className="bg-[#0f0f1a] rounded p-2">
              <div className="text-xs text-gray-500">Résistance Max</div>
              <div className="text-red-400 font-bold">{tech.resistance252.toLocaleString('fr-FR')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Variations */}
      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
        <div className="text-sm font-semibold text-gray-300 mb-3">Variations</div>
        <div className="flex gap-4">
          <VariationBadge value={tech.var7j} label="7 jours" />
          <VariationBadge value={tech.var30j} label="30 jours" />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 pt-2">
        Données BRVM · {tech.nbJours} jours d'historique · Dernière mise à jour {tech.date}
      </div>
    </div>
  );
}
