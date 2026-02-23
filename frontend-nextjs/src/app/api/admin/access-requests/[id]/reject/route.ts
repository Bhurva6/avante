import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    // In production, update database to reject access request with requestId
    // For now, always return not found or success as a placeholder

    // Example: return not found
    return NextResponse.json(
      { message: 'Access request not found' },
      { status: 404 }
    );

    // Or, if you want to always return success:
    // return NextResponse.json({ message: 'Access request rejected' });
  } catch (error) {
    console.error('Error rejecting access request:', error);
    return NextResponse.json(
      { message: 'Error rejecting access request', error: String(error) },
      { status: 500 }
    );
  }
}
