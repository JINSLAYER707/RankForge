const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
        const fileName = path.parse(file.originalname).name;

        // Determine folder
        let folderName = 'uploads/others';
        if (file.fieldname === "problemFile") folderName = 'uploads/problems';
        
        // FORCE 'image' for PDFs so they are viewable in-browser
        // Use 'raw' only for things like .zip, .rar, .docx
        let rType = 'raw';
        if (['jpg', 'jpeg', 'png', 'gif', 'pdf'].includes(fileExt)) {
            rType = 'image'; 
        }

        return {
            folder: folderName,
            resource_type: rType,
            public_id: `${Date.now()}-${fileName}`,
            // Do NOT use 'format' here if resource_type is 'raw'
            // But we NEED it for 'image' (PDFs)
            format: rType === 'image' ? fileExt : undefined 
        };
    }
});

const upload = multer({ storage });
module.exports = upload;