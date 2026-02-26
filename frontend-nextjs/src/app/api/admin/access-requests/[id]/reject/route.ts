import { NextRequest, NextResponse } from 'next/server';

const FLASK_BASE = process.env.FLASK_URL || 'http://localhost:5000';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${FLASK_BASE}/api/admin/access-requests/${encodeURIComponent(params.id)}/reject`,
      { method: 'POST' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Reject request proxy error:', error);
    return NextResponse.json({ message: 'Cannot connect to backend server.' }, { status: 503 });
  }
}
