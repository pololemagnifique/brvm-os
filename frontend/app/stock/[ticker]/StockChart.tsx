"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  Time,
} from "lightweight-charts";

interface CandlePoint {
  time: number;
  value: number;
}

interface StockChartProps {
  ticker: string;
  history: CandlePoint[];
  mm20: CandlePoint[];
  mm50: CandlePoint[];
}

type Timeframe = "1W" | "1M" | "3M";

export default function StockChart({
  ticker,
  history,
  mm20,
  mm50,
}: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const mm20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const mm50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const [tf, setTf] = useState<Timeframe>("1M");

  function filterByTf(data: CandlePoint[]): CandlePoint[] {
    if (data.length === 0) return [];
    const now = data[data.length - 1].time;
    let cutDays = 7;
    if (tf === "1M") cutDays = 30;
    if (tf === "3M") return data;
    const cutoff = now - cutDays * 86400;
    return data.filter((d) => d.time >= cutoff);
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0a0f0d" },
        textColor: "#9ca3af",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "#1a2a22" },
        horzLines: { color: "#1a2a22" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#00ff88", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#00ff88", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: "#2d3d32",
        textColor: "#9ca3af",
      },
      timeScale: {
        borderColor: "#2d3d32",
        timeVisible: false,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          });
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    const mainSeries = chart.addSeries(LineSeries, {
      color: "#00ff88",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    const ma20Series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ma50Series = chart.addSeries(LineSeries, {
      color: "#8b5cf6",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = mainSeries;
    mm20Ref.current = ma20Series;
    mm50Ref.current = ma50Series;

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: 340,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Update data when tf changes
  useEffect(() => {
    if (!seriesRef.current || !mm20Ref.current || !mm50Ref.current) return;
    const filtered = filterByTf(history);
    const mm20f = filterByTf(mm20);
    const mm50f = filterByTf(mm50);
    seriesRef.current.setData(filtered as any);
    mm20Ref.current.setData(mm20f as any);
    mm50Ref.current.setData(mm50f as any);
    chartRef.current?.timeScale().fitContent();
  }, [tf, history, mm20, mm50]);

  const tfBtns: Timeframe[] = ["1W", "1M", "3M"];

  return (
    <div>
      {/* Timeframe buttons */}
      <div className="flex gap-2 mb-3">
        {tfBtns.map((b) => (
          <button
            key={b}
            onClick={() => setTf(b)}
            style={{
              padding: "4px 14px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: tf === b ? "#00ff88" : "#2d3d32",
              background: tf === b ? "rgba(0,255,136,0.1)" : "transparent",
              color: tf === b ? "#00ff88" : "#9ca3af",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: 340, borderRadius: 8, overflow: "hidden" }}
      />

      {/* Legend */}
      <div className="flex gap-5 mt-2">
        <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "#00ff88", borderRadius: 1 }} />
          {ticker}
        </span>
        <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "#f59e0b", borderRadius: 1 }} />
          MM20
        </span>
        <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 20, height: 2, background: "#8b5cf6", borderRadius: 1 }} />
          MM50
        </span>
      </div>
    </div>
  );
}
