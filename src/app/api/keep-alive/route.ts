import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Always execute dynamically so the response is not cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lightweight ping query: fetch a single record to keep the Supabase database awake
    const { data, error } = await supabase
      .from('likit_transactions')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[keep-alive] Supabase query error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase keep-alive ping successful',
      timestamp: new Date().toISOString(),
      rowsFound: data?.length ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[keep-alive] Unexpected exception:', message);
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
