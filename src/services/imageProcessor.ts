import Queue from 'bull';
import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { ProcessingRequest, ProductData, ProcessingStatus } from '../types';
import { ProcessingRequest as ProcessingRequestModel } from '../models/ProcessingRequest';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const imageQueue = new Queue('image-processing', REDIS_URL);

export class ImageProcessor {
  private static async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }

  private static async compressImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .jpeg({ quality: 50 })
      .toBuffer();
  }

  private static async saveImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, imageBuffer);
    
    return `/uploads/${filename}`;
  }

  static async processImage(url: string, requestId: string, index: number): Promise<string> {
    try {
      const imageBuffer = await this.downloadImage(url);
      const compressedBuffer = await this.compressImage(imageBuffer);
      const filename = `${requestId}_${index}_${Date.now()}.jpg`;
      return await this.saveImage(compressedBuffer, filename);
    } catch (error) {
      console.error(`Error processing image ${url}:`, error);
      throw error;
    }
  }

  static async processRequest(requestId: string): Promise<void> {
    const request = await ProcessingRequestModel.findOne({ requestId });
    if (!request) throw new Error('Request not found');

    request.status = ProcessingStatus.PROCESSING;
    await request.save();

    try {
      for (const product of request.products) {
        const outputUrls: string[] = [];
        
        for (let i = 0; i < product.inputImageUrls.length; i++) {
          const url = product.inputImageUrls[i];
          const processedUrl = await this.processImage(url, requestId, i);
          outputUrls.push(processedUrl);
          
          request.processedImages += 1;
          await request.save();
        }
        
        product.outputImageUrls = outputUrls;
      }

      request.status = ProcessingStatus.COMPLETED;
      await request.save();

      // Trigger webhook if configured
      if (process.env.WEBHOOK_URL) {
        await this.triggerWebhook(request);
      }
    } catch (error) {
      request.status = ProcessingStatus.FAILED;
      await request.save();
      throw error;
    }
  }

  static async triggerWebhook(request: any): Promise<void> {
    try {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        requestId: request.requestId,
        status: request.status,
        completedAt: new Date(),
        totalProducts: request.products.length,
        totalImages: request.totalImages
      };

      await axios.post(webhookUrl, payload);
    } catch (error) {
      console.error('Webhook trigger failed:', error);
    }
  }
}
