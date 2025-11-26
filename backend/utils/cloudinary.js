import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Promisify Cloudinary methods
const uploadAsync = promisify(cloudinary.uploader.upload);
const destroyAsync = promisify(cloudinary.uploader.destroy);

// Upload image to Cloudinary
export const uploadImage = async (imagePath, options = {}) => {
  try {
    const result = await uploadAsync(imagePath, {
      folder: 'nutrideliver',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (imagePaths, options = {}) => {
  try {
    const uploadPromises = imagePaths.map(imagePath => 
      uploadImage(imagePath, options)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await destroyAsync(publicId);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate image URL with transformations
export const generateImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
};

// Optimize image for web
export const optimizeImage = (publicId, width = 800, height = 600) => {
  return cloudinary.url(publicId, {
    secure: true,
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Create thumbnail
export const createThumbnail = (publicId, width = 300, height = 200) => {
  return cloudinary.url(publicId, {
    secure: true,
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  return matches ? matches[1] : null;
};