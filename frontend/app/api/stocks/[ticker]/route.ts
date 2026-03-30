import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const token = req.headers.get('authorization');

  const headers: Record<string, string> = {};
  if (token) headers['authorization'] = token;

  const res = await fetch(`${API}/api/stocks/${ticker}`, { headers });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
