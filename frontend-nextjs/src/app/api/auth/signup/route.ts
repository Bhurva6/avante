import { NextRequest, NextResponse } from 'next/server';
import mockDb, { getAccessRequests, createAccessRequest, type AccessRequest } from '@/lib/mockDatabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, requestedStates } = body;

    // Validation
    if (!fullName || !email || !password || !requestedStates || requestedStates.length === 0) {
      return NextResponse.json(
        { error: 'All fields are required. Please provide full name, email, password, and at least one state.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if email already exists in access requests
    const existingRequests = await getAccessRequests();
    const existingRequest = existingRequests.find((req: AccessRequest) => req.email.toLowerCase() === email.toLowerCase());
    if (existingRequest) {
      return NextResponse.json(
        { error: 'An access request with this email already exists. Please wait for admin approval.' },
        { status: 409 }
      );
    }

    // Create new access request via adapter
    const newReq = await createAccessRequest({ fullName, email, password, requestedStates });

    console.log('New access request created:', {
      id: newReq.id,
      email: newReq.email,
      states: newReq.requestedStates,
    });

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully! Admin will review your request and notify you via email.',
      requestId: newReq.id,
    });

  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json(
      { error: 'Failed to create access request. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all access requests (for admin)
export async function GET() {
  try {
    const requests = await getAccessRequests();
    return NextResponse.json({
      accessRequests: requests.map((req: AccessRequest) => ({
        ...req,
        password: '***', // Don't expose passwords in responses
      })),
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return NextResponse.json({ accessRequests: [] });
  }
}
