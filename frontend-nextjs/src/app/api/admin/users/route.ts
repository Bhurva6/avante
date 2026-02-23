import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, fetch from database
    return NextResponse.json({ users: [] }); // No mockUsers
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching users', error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, states, role = 'user' } = body;

    if (!email || !password || !states || states.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields: email, password, and states' },
        { status: 400 }
      );
    }

    // In production, check if user exists in database
    // For now, always allow creation

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      username: email.split('@')[0],
      password, // In production, hash this
      fullName: email.split('@')[0], // Extract name from email
      role: role as 'admin' | 'user',
      allowedStates: states,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // In production, save to database
    console.log('Created user:', { email: newUser.email, allowedStates: newUser.allowedStates });

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Error creating user', error: String(error) },
      { status: 500 }
    );
  }
}
