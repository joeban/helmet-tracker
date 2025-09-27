import { NextRequest, NextResponse } from 'next/server';

/**
 * Amazon SP-API OAuth Callback Handler
 *
 * This endpoint handles the OAuth callback from Amazon's SP-API authentication flow.
 * Amazon will redirect users here after they authorize the HelmetScore application.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Amazon OAuth error:', error);
    return NextResponse.json(
      { error: 'Amazon authorization failed', details: error },
      { status: 400 }
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code missing from Amazon callback' },
      { status: 400 }
    );
  }

  try {
    // TODO: Exchange authorization code for access token
    // This will be implemented once we receive SP-API credentials from Amazon

    console.log('Amazon OAuth callback received:', {
      code: code.substring(0, 10) + '...', // Log partial code for debugging
      state,
      timestamp: new Date().toISOString()
    });

    // For now, return success response
    // In production, this would exchange the code for tokens and store them securely
    return NextResponse.json({
      success: true,
      message: 'Amazon authorization received successfully',
      redirectUrl: '/' // Redirect back to main page
    });

  } catch (error) {
    console.error('Error processing Amazon OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to process Amazon authorization' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests (if needed for webhook-style callbacks)
 */
export async function POST() {
  return NextResponse.json(
    { error: 'POST method not supported for OAuth callback' },
    { status: 405 }
  );
}