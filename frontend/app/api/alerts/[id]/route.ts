import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('x-token') || '';
  const res = await fetch(`${API}/api/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  return NextResponse.json(await res.json());
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const token = req.headers.get('x-token') || '';
  const method = body._method || 'PATCH';
  const url = body._method
    ? `${API}/api/alerts/${id}/${body._method}`
    : `${API}/api/alerts/${id}`;
  delete body._method;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('x-token') || '';
  const res = await fetch(`${API}/api/alerts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json({ deleted: res.ok }, { status: res.status });
}
