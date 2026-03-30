import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-token') || '';
  const res = await fetch(`${API}/api/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.headers.get('x-token') || '';
  const res = await fetch(`${API}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
