import supabase from './supabaseClient';

const BUCKET_NAME = 'isl-assets'; // You can customize this bucket name

interface ImageData {
  url: string | null;
  error: string | null;
}

// Simple in-memory cache to store fetched URLs
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Track ongoing requests to prevent duplicate requests for the same file
const ongoingRequests = new Map<string, Promise<any>>();

/**
 * Get the public URL for an image in Supabase storage
 * @param fileName - Name of the file in the storage bucket
 * @returns Public URL for the image or null if not found
 */
export const getImageUrl = async (fileName: string): Promise<ImageData> => {
  if (!fileName) {
    return { url: null, error: 'File name is required' };
  }

  // Check cache first
  const cached = imageCache.get(fileName);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return { url: cached.url, error: null };
  }

  // Check if there's already an ongoing request for this file
  if (ongoingRequests.has(fileName)) {
    // Wait for the ongoing request to complete
    return ongoingRequests.get(fileName);
  }

  // Create a new promise for this request
  const requestPromise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(fileName, 60 * 60); // URL valid for 1 hour

      if (error) {
        console.error('Error getting image URL:', error);
        return { url: null, error: error.message };
      }

      // Store in cache
      imageCache.set(fileName, { url: data.signedUrl, timestamp: Date.now() });
      
      return { url: data.signedUrl, error: null };
    } catch (err) {
      console.error('Unexpected error getting image URL:', err);
      return { url: null, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      // Remove the ongoing request when complete
      ongoingRequests.delete(fileName);
    }
  })();

  // Store the promise to prevent duplicate requests
  ongoingRequests.set(fileName, requestPromise);
  
  return requestPromise;
};

/**
 * Get multiple image URLs in batch
 * @param fileNames - Array of file names to fetch
 * @returns Array of objects with fileName, url, and error
 */
export const getImageUrls = async (fileNames: string[]): Promise<Array<{fileName: string, url: string | null, error: string | null}>> => {
  // Use Promise.allSettled to handle individual failures without failing the entire batch
  const results = await Promise.allSettled(
    fileNames.map(async (fileName) => {
      const result = await getImageUrl(fileName);
      return {
        fileName,
        url: result.url,
        error: result.error
      };
    })
  );

  // Filter out failed promises and return successful results
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};

/**
 * Upload an image to Supabase storage
 * @param file - File object to upload
 * @param fileName - Name to save the file as
 * @param folder - Optional folder path in the bucket
 * @returns Object with success status and error if any
 */
export const uploadImage = async (file: File, fileName: string, folder: string = ''): Promise<{ success: boolean; error: string | null; path?: string }> => {
  try {
    // Ensure file type is image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return { success: false, error: 'File must be an image or video' };
    }

    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if file exists
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null, path: data.path };
  } catch (err) {
    console.error('Unexpected error uploading image:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * List all files in a specific folder or the entire bucket
 * @param folderPath - Optional folder path to list files from
 * @returns Array of file objects
 */
export const listFiles = async (folderPath: string = ''): Promise<{ files: any[]; error: string | null }> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return { files: [], error: error.message };
    }

    return { files: data, error: null };
  } catch (err) {
    console.error('Unexpected error listing files:', err);
    return { files: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Delete an image from Supabase storage
 * @param fileName - Name of the file to delete
 * @returns Object with success status and error if any
 */
export const deleteImage = async (fileName: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error deleting image:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};