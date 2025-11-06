import { supabase, supabaseAdmin } from './supabase'

/**
 * Upload image to Supabase Storage
 * @param imageUrl - URL of the image to download and upload
 * @param fileName - Optional custom filename
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  fileName?: string
): Promise<string> {
  try {
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to download image')
    }

    const blob = await response.blob()
    
    // Generate filename if not provided
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = blob.type.split('/')[1] || 'png'
    const finalFileName = fileName || `generated-${timestamp}-${randomString}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(finalFileName, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = await supabase.storage
      .from('media')
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading to Supabase:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage
 * @param filePath - Path of the file in storage
 */
export async function deleteImageFromSupabase(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from('media').remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error)
    throw error
  }
}

/**
 * List all images in media bucket
 */
export async function listImagesFromSupabase() {
  try {
    const { data, error } = await supabase.storage.from('media').list()

    if (error) {
      console.error('Supabase list error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error listing from Supabase:', error)
    throw error
  }
}

/**
 * Upload knowledge base files to Supabase Storage
 */
export async function uploadKnowledgeBaseFiles(
  files: File[], 
  knowledgeBaseId: string,
  userId: string
) {
  const uploadedFiles = []
  
  for (const file of files) {
    const fileName = `${userId}/${knowledgeBaseId}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('knowledge-bases')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      throw error
    }
    
    // Get public URL
    const { data: { publicUrl } } = await supabaseAdmin.storage
      .from('knowledge-bases')
      .getPublicUrl(fileName)
    
    uploadedFiles.push({
      id: data.id,
      name: file.name,
      size: file.size,
      type: file.type,
      path: data.path,
      publicUrl
    })
  }
  
  return uploadedFiles
}

/**
 * Delete knowledge base files from Supabase Storage
 */
export async function deleteKnowledgeBaseFiles(filePaths: string[]) {
  const { error } = await supabaseAdmin.storage
    .from('knowledge-bases')
    .remove(filePaths)
  
  if (error) {
    console.error('Delete error:', error)
    throw error
  }
  
  return true
}

/**
 * Create knowledge base storage bucket
 */
export async function createKnowledgeBaseBucket() {
  const { data, error } = await supabaseAdmin.storage
    .createBucket('knowledge-bases', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ],
      fileSizeLimit: 52428800 // 50MB
    })
  
  if (error && error.message !== 'Bucket already exists') {
    console.error('Bucket creation error:', error)
    throw error
  }
  
  return data
}
