import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

function authHeaders(req: NextRequest) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const cookie = req.headers.get('cookie');
  if (cookie) h['cookie'] = cookie;
  const auth = req.headers.get('authorization');
  if (auth) h['authorization'] = auth;
  return h;
}

export async function GET(req: NextRequest) {
  const res = await fetch(`${API}/api/portfolios`, {
    headers: authHeaders(req),
    credentials: 'include',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API}/api/portfolios`, {
    method: 'POST',
    headers: authHeaders(req),
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
