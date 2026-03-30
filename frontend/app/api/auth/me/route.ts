import { NextRequest, NextResponse } from 'next/server';
const API = process.env.API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  const res = await fetch(`${API}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
