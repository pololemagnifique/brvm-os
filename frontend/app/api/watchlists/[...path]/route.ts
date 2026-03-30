import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.headers.get('Authorization') || '';
  const backendPath = '/api/watchlists/' + (path || []).join('/');
  const url = new URL(req.url);
  const res = await fetch(`${API}${backendPath}${url.search}`, {
    headers: { Authorization: token },
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.headers.get('Authorization') || '';
  const backendPath = '/api/watchlists/' + (path || []).join('/');
  const body = await req.text();
  const res = await fetch(`${API}${backendPath}`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.headers.get('Authorization') || '';
  const backendPath = '/api/watchlists/' + (path || []).join('/');
  const body = await req.text();
  const res = await fetch(`${API}${backendPath}`, {
    method: 'PUT',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body,
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const token = req.headers.get('Authorization') || '';
  const backendPath = '/api/watchlists/' + (path || []).join('/');
  const res = await fetch(`${API}${backendPath}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
  const text = await res.text();
  try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
  catch { return NextResponse.json({ error: text }, { status: res.status }); }
}
