import { supabase } from '../supabase'

/**
 * 上传图片到Supabase存储
 * @param {File[]} files - 要上传的文件数组
 * @param {string} userId - 用户ID，用于创建用户专属的存储路径
 * @returns {Promise<string[]>} - 返回上传成功的图片URL数组
 */
export async function uploadImages(files, userId) {
  if (!files || files.length === 0) return []
  
  const urls = []
  const timestamp = new Date().getTime()
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}_${timestamp}_${i}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      
      // 上传文件到Supabase存储
      const { data, error } = await supabase.storage
        .from('habit-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('habit-images')
        .getPublicUrl(data.path)
      
      urls.push(publicUrl)
    }
    
    return urls
  } catch (error) {
    console.error('Error uploading images:', error)
    throw error
  }
}

/**
 * 从Supabase存储中删除图片
 * @param {string} url - 要删除的图片URL
 * @returns {Promise<void>}
 */
export async function deleteImage(url) {
  try {
    // 从URL中提取文件路径
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketName = 'habit-images'
    
    // 找到文件路径，通常是最后两部分（用户ID/文件名）
    const filePath = pathParts.slice(-2).join('/')
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])
    
    if (error) throw error
    
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}