import { NextRequest, NextResponse } from 'next/server';

const FLASK_BASE = process.env.FLASK_URL || 'http://localhost:5000';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${FLASK_BASE}/api/admin/users/${encodeURIComponent(params.id)}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete user proxy error:', error);
    return NextResponse.json({ message: 'Cannot connect to backend server.' }, { status: 503 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(
      `${FLASK_BASE}/api/admin/users/${encodeURIComponent(params.id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update user proxy error:', error);
    return NextResponse.json({ message: 'Cannot connect to backend server.' }, { status: 503 });
  }
}
