const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage - use Cloudinary if configured, otherwise use memory storage
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ebake/cakes',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      public_id: (req, file) => {
        // Generate unique filename
        return `cake_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
      }
    },
  });
} else {
  // Fallback to memory storage for development
  console.warn('Cloudinary not configured, using memory storage');
  storage = multer.memoryStorage();
}

// File filter
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }
  
  next(error);
};

// Helper function to delete image from Cloudinary
const deleteImage = async (imageUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const publicId = imageUrl.split('/').pop().split('.')[0];
    const result = await cloudinary.uploader.destroy(`ebake/cakes/${publicId}`);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error);
    return null;
  }
};

module.exports = {
  upload,
  handleUploadError,
  deleteImage,
  cloudinary
};
