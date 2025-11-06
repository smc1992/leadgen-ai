import { supabase, supabaseAdmin } from '@/lib/supabase'

// Test function to check Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('email_templates')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Test if tables exist
    const tables = ['email_templates', 'email_sequences', 'email_campaigns', 'knowledge_bases']
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
      tables: results,
      storage: bucketResults
    }
    
  } catch (error) {
    console.error('Test failed:', error)
    return { success: false, error: error.message }
  }
}

// Test API endpoint
export async function GET() {
  const result = await testSupabaseConnection()
  
  return Response.json(result)
}
