import { NextResponse } from 'next/server';

const FLASK_BASE = process.env.FLASK_URL || 'http://localhost:5000';

export async function GET() {
  try {
    const response = await fetch(`${FLASK_BASE}/api/admin/access-requests`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get access requests proxy error:', error);
    return NextResponse.json({ requests: [] }, { status: 503 });
  }
}
