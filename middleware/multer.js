import multer from 'multer';
import path from 'path';

// save files to uploads/ folder with unique timestamped name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// only allow these file types
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error('Only PDF, DOC, DOCX, ZIP files are allowed'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

export default upload;