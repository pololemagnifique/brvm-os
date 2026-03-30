import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

function authHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) h['Authorization'] = auth;
  return h;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');

  // Special handling for CSV endpoint
  if (pathStr.endsWith('.csv')) {
    const res = await fetch(`${API}/api/portfolios/${pathStr}`, {
      headers: authHeaders(req),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${pathStr.split('/').pop()}"`,
      },
    });
  }

  const res = await fetch(`${API}/api/portfolios/${pathStr}`, {
    headers: authHeaders(req),
    credentials: 'include',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const body = await req.json();
  const res = await fetch(`${API}/api/portfolios/${pathStr}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(req) },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const res = await fetch(`${API}/api/portfolios/${pathStr}`, {
    method: 'DELETE',
    headers: authHeaders(req),
    credentials: 'include',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
