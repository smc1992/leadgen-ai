import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Test function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return {
        success: false,
        error: 'Supabase ist nicht konfiguriert',
        configured: false
      }
    }
    
    // Test if tables exist
    const tables = ['email_templates', 'email_sequences', 'email_campaigns', 'knowledge_bases', 'lead_lists', 'lead_list_items', 'leads']
    const results = {}
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1)
      
      results[table] = {
        exists: !tableError,
        error: tableError?.message
      }
    }
    
    // Test if storage buckets exist
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets()
    
    const bucketResults = {
      exists: !bucketError,
      buckets: buckets?.map(b => b.name) || [],
      error: bucketError?.message
    }
    
    return {
      success: true,
      configured: true,
      tables: results,
      storage: bucketResults
    }
    
  } catch (error) {
    console.error('Test failed:', error)
    return { success: false, error: (error as any)?.message || 'Unknown error' }
  }
}

// Test API endpoint
export async function GET() {
  const result = await testSupabaseConnection()
  
  return Response.json(result)
}
