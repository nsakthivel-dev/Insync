/**
 * Utility functions for preloading images to improve performance
 */

interface PreloadResult {
  url: string;
  loaded: boolean;
  error?: string;
}

/**
 * Preload multiple images in parallel
 * @param urls - Array of image URLs to preload
 * @returns Array of preload results
 */
export const preloadImages = async (urls: string[]): Promise<PreloadResult[]> => {
  const promises = urls.map(url => {
    return new Promise<PreloadResult>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ url, loaded: true });
      };
      
      img.onerror = () => {
        resolve({ url, loaded: false, error: 'Failed to load image' });
      };
      
      img.src = url;
    });
  });
  
  return Promise.all(promises);
};

/**
 * Preload video files (just metadata) to improve performance
 * @param urls - Array of video URLs to preload
 * @returns Array of preload results
 */
export const preloadVideos = async (urls: string[]): Promise<PreloadResult[]> => {
  const promises = urls.map(url => {
    return new Promise<PreloadResult>((resolve) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        resolve({ url, loaded: true });
      };
      
      video.onerror = () => {
        resolve({ url, loaded: false, error: 'Failed to load video' });
      };
      
      video.preload = 'metadata';
      video.src = url;
    });
  });
  
  return Promise.all(promises);
};

/**
 * Preload both images and videos
 * @param imageUrls - Array of image URLs to preload
 * @param videoUrls - Array of video URLs to preload
 * @returns Combined preload results
 */
export const preloadMedia = async (
  imageUrls: string[] = [],
  videoUrls: string[] = []
): Promise<{ images: PreloadResult[]; videos: PreloadResult[] }> => {
  const [images, videos] = await Promise.all([
    preloadImages(imageUrls),
    preloadVideos(videoUrls)
  ]);
  
  return { images, videos };
};