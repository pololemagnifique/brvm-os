import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization') || '';
  const res = await fetch(`${API}/api/watchlists`, {
    headers: { Authorization: token },
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization') || '';
  const body = await req.text();
  const res = await fetch(`${API}/api/watchlists`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}
