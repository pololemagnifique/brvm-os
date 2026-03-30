import { NextResponse } from "next/server";

const EOD_PATH =
  "/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    // Fetch from NestJS backend
    const backendRes = await fetch(
      `http://localhost:3000/api/stocks${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      { next: { revalidate: 60 } }
    );

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Backend unavailable" },
        { status: 502 }
      );
    }

    const stocks: Array<{
      ticker: string;
      companyName: string;
      company_name?: string;
      sector?: string;
    }> = await backendRes.json();

    // Load eod_data for var_7d, var_30d, volume, last price
    let eodStocks: Record<
      string,
      {
        var_7d: number;
        var_30d: number;
        volume: number;
        last: number;
        change_pct: number;
      }
    > = {};

    try {
      const fs = await import("fs");
      const eodRaw = fs.readFileSync(EOD_PATH, "utf-8");
      const eodData = JSON.parse(eodRaw);
      // eod_data.json has a "stocks" array
      const stockList = Array.isArray(eodData)
        ? eodData
        : (eodData.stocks || []);
      for (const s of stockList) {
        if (s && s.ticker) {
          eodStocks[s.ticker] = s;
        }
      }
    } catch {
      // EOD data unavailable — proceed without it
    }

    const enriched = stocks.map((s) => {
      const ticker = s.ticker;
      const eod = eodStocks[ticker] || {};
      return {
        ticker,
        companyName: s.companyName || (s as any).company_name || "",
        sector: s.sector || "",
        last: eod.last ?? null,
        var_7d: eod.var_7d ?? null,
        var_30d: eod.var_30d ?? null,
        volume: eod.volume ?? null,
        change_pct: eod.change_pct ?? null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
