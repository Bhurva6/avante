import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // In production, find user by email or username in database
    // For now, always return invalid credentials as a placeholder
    return NextResponse.json(
      { error: 'Invalid credentials. Please check your email/username and password.' },
      { status: 401 }
    );
    // Or, if you want to always return success:
    // return NextResponse.json({ success: true, user: { ... }, message: 'Login successful!' });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
