import express from 'express';
import multer from 'multer';
import { ProcessingController } from '../controllers/processingController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload CSV route
router.post('/upload', upload.single('csv'), ProcessingController.uploadCSV);

// Get processing status route
router.get('/status/:requestId', ProcessingController.getStatus);

export default router;
