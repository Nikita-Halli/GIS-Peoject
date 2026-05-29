import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.detail || 'Login failed' },
        { status: response.status }
      );
    }

    const roleMap: { [key: string]: string } = {
      'Administrator': 'admin',
      'Healthcare Professional': 'doctor',
      'Public Health Society': 'society',
    };

    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
      user: { ...data.user, role: roleMap[data.user.role] || 'doctor' },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}