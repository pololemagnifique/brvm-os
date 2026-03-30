import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const EOD_PATH = '/data/.openclaw/workspace/brvm-os/dashboard/data/eod_data.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = readFileSync(EOD_PATH, 'utf-8');
    const data = JSON.parse(raw);
    // Return the full object: { indices, stocks, ... } for the dashboard
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
