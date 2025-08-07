import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from './auth';

// Helper to create authenticated API handlers
export function createAuthenticatedHandler<T = any>(
  handler: (req: NextRequest, session: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getAuthSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      return await handler(req, session);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to get user ID from session with proper error handling
export async function requireUserId(): Promise<string> {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    throw new Error('User ID not found in session');
  }
  
  return session.user.id;
}