import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

// Helper function to check auth in API routes
export async function withAuth<T>(
  handler: (session: any) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const session = await requireAuth();
    return await handler(session);
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}