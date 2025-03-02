import express from 'express';
import multer from 'multer';
import { ProcessingController } from '../controllers/processingController';
import { WebhookController } from '../controllers/webhookController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload CSV route
router.post('/upload', upload.single('csv'), ProcessingController.uploadCSV);

// Get processing status route
router.get('/status/:requestId', ProcessingController.getStatus);

// Webhook endpoint for processing completion
router.post('/webhook', WebhookController.handleProcessingComplete);

export default router;
