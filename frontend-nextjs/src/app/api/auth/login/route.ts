import { NextRequest, NextResponse } from 'next/server';

const FLASK_BASE = process.env.FLASK_URL || 'http://localhost:5000';

// Proxy to Flask backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${FLASK_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json({ message: 'Cannot connect to backend server.' }, { status: 503 });
  }
}
