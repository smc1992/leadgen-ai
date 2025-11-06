import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('email_campaigns')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }

    // Check if outreach_emails table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'outreach_emails')

    const tableExists = tables && tables.length > 0

    return NextResponse.json({
      success: true,
      database_connected: true,
      outreach_emails_table_exists: tableExists,
      tables_found: tableExists ? 1 : 0,
      message: tableExists
        ? 'Database connected and outreach_emails table exists!'
        : 'Database connected but outreach_emails table missing. Please create it.'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
