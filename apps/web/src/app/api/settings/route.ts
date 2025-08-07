import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SettingsSchema = z.object({
  displayName: z.string().optional(),
  emailNotifications: z.boolean(),
  notificationEmail: z.string().email().optional(),
  defaultNetwork: z.enum(['mainnet', 'testnet']).optional(),
  transactionConfirmations: z.boolean().optional(),
  slippageTolerance: z.string().optional(),
  autoRefresh: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validatedData = SettingsSchema.parse(body);
    
    // Validate email is provided when notifications are enabled
    if (validatedData.emailNotifications && !validatedData.notificationEmail) {
      return NextResponse.json(
        { error: 'Email address is required when email notifications are enabled' },
        { status: 400 }
      );
    }
    
    // Here you would typically save to a database
    // For now, we'll just return the validated data
    console.log('Settings updated:', validatedData);
    
    return NextResponse.json({
      success: true,
      settings: validatedData,
      message: 'Settings updated successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return current settings (mock data for now)
  return NextResponse.json({
    displayName: '',
    emailNotifications: false,
    notificationEmail: '',
    defaultNetwork: 'mainnet',
    transactionConfirmations: true,
    slippageTolerance: '0.5',
    autoRefresh: true,
  });
}