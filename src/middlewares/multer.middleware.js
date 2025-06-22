import multer from 'multer';
import path from 'path'; // Import path module for robust file path handling
import fs from 'fs';   // Import fs module to check/create directories

// Define the temporary directory where files will be stored before uploading to Cloudinary
const tempDir = './public/temp';

// --- IMPORTANT: Ensure the temporary directory exists ---
// This prevents errors if the directory doesn't exist when Multer tries to save files.
try {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`Multer: Created temporary directory: ${tempDir}`);
    }
} catch (error) {
    console.error(`Multer: Error creating temporary directory ${tempDir}:`, error);

}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
       
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);

        // Example: "avatar-1678888888888-123456789.png"
        cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);

    }
});

export const upload = multer({
    storage: storage,

});

console.log('Multer Middleware: Configuration loaded successfully.');