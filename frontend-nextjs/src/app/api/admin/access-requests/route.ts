import { NextRequest, NextResponse } from 'next/server';

// Mock database for development
const mockAccessRequests: any[] = [
  {
    id: '1',
    email: 'newuser@example.com',
    requestedAt: new Date().toISOString(),
    states: ['Tamil Nadu', 'Telangana'],
    status: 'pending'
  }
];

export async function GET() {
  try {
    // In production, fetch from database
    return NextResponse.json({ requests: mockAccessRequests });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching access requests', error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, states } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Missing email field' },
        { status: 400 }
      );
    }

    const newRequest = {
      id: Date.now().toString(),
      email,
      states: states || [],
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    mockAccessRequests.push(newRequest);

    // In production, save to database
    console.log('Created access request:', newRequest);

    return NextResponse.json(
      { message: 'Access request created successfully', request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error creating access request', error },
      { status: 500 }
    );
  }
}
