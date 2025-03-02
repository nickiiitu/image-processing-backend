import Queue from "bull";
import sharp from "sharp";
import axios from "axios";
import path from "path";
import fs from "fs/promises";
import { ProcessingStatus } from "../types";
import { ProcessingRequest as ProcessingRequestModel } from "../models/ProcessingRequest";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const imageQueue = new Queue("image-processing", REDIS_URL);

export class ImageProcessor {
  private static async downloadImage(
    url: string,
    jobId: string
  ): Promise<Buffer> {
    console.log(`[Job ${jobId}]: Starting download of image...`);
    const startTime = Date.now();
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const duration = Date.now() - startTime;
    console.log(`[Job ${jobId}]: Download completed in ${duration}ms`);
    return Buffer.from(response.data, "binary");
  }

  private static async compressImage(
    imageBuffer: Buffer,
    jobId: string
  ): Promise<Buffer> {
    console.log(`[Job ${jobId}]: Starting image compression...`);
    const startTime = Date.now();
    const compressedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 50 })
      .toBuffer();
    const duration = Date.now() - startTime;
    console.log(`[Job ${jobId}]: Compression completed in ${duration}ms`);
    return compressedBuffer;
  }

  private static async saveImage(
    imageBuffer: Buffer,
    filename: string,
    jobId: string
  ): Promise<string> {
    console.log(`[Job ${jobId}]: Saving processed image...`);
    const startTime = Date.now();

    const uploadDir = path.join(__dirname, "../../uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, imageBuffer);

    const duration = Date.now() - startTime;
    console.log(`[Job ${jobId}]: Save completed in ${duration}ms`);
    return `/uploads/${filename}`;
  }

  static async processImage(
    url: string,
    requestId: string,
    index: number,
    jobId: string
  ): Promise<string> {
    try {
      console.log(`\n[Job ${jobId}]: Starting image processing pipeline...`);
      console.log(
        `[Job ${jobId}]: Processing image ${index + 1} from URL: ${url}`
      );

      const startTime = Date.now();
      const imageBuffer = await this.downloadImage(url, jobId);
      const compressedBuffer = await this.compressImage(imageBuffer, jobId);
      const filename = `${requestId}_${index}_${Date.now()}.jpg`;
      const savedPath = await this.saveImage(compressedBuffer, filename, jobId);

      const totalDuration = Date.now() - startTime;
      console.log(
        `[Job ${jobId}]: Image processing completed in ${totalDuration}ms\n`
      );
      return savedPath;
    } catch (error) {
      console.error(`[Job ${jobId}]: Error processing image ${url}:`, error);
      throw error;
    }
  }

  static async processRequest(requestId: string): Promise<void> {
    const request = await ProcessingRequestModel.findOne({ requestId });
    if (!request) throw new Error("Request not found");

    request.status = ProcessingStatus.PROCESSING;
    await request.save();

    try {
      console.log("\n Starting image processing queue...");
      console.log(`Total images to process: ${request.totalImages}\n`);

      // Create a queue processor for concurrent image processing
      imageQueue.process(async (job) => {
        const { url, requestId, index, productIndex } = job.data;
        const jobId = `${productIndex + 1}-${index + 1}`;
        const processedUrl = await this.processImage(
          url,
          requestId,
          index,
          jobId
        );

        // Update the request with processed image
        const request = await ProcessingRequestModel.findOne({ requestId });
        if (!request) throw new Error("Request not found");

        // Initialize outputImageUrls array if it doesn't exist
        if (!request.products[productIndex].outputImageUrls) {
          request.products[productIndex].outputImageUrls = [];
        }

        request.products[productIndex].outputImageUrls[index] = processedUrl;
        request.processedImages += 1;

        // Check if all images are processed
        if (request.processedImages === request.totalImages) {
          request.status = ProcessingStatus.COMPLETED;
          // Trigger local webhook
          try {
            await axios.post("http://localhost:3000/api/webhook", {
              requestId: request.requestId,
              status: request.status,
              totalImages: request.totalImages,
              processedImages: request.processedImages,
              products: request.products,
            });
            console.log("Webhook notification sent successfully");
          } catch (error) {
            console.error("Failed to send webhook notification:", error);
          }
        }

        await request.save();
        return processedUrl;
      });

      // Add all images to the queue for parallel processing
      console.log("Adding images to processing queue...");
      const imageJobs: any[] = [];
      request.products.forEach((product, productIndex) => {
        console.log(`\n Product ${productIndex + 1}: ${product.productName}`);
        product.inputImageUrls.forEach((url, index) => {
          console.log(`Queuing image ${index + 1}`);
          imageJobs.push(
            imageQueue.add(
              {
                url,
                requestId,
                index,
                productIndex,
              },
              {
                attempts: 3,
                backoff: {
                  type: "exponential",
                  delay: 2000,
                },
              }
            )
          );
        });
      });

      // Wait for all jobs to complete
      await Promise.all(imageJobs);
    } catch (error) {
      const failedRequest = await ProcessingRequestModel.findOne({ requestId });
      if (failedRequest) {
        failedRequest.status = ProcessingStatus.FAILED;
        await failedRequest.save();
      }
      throw error;
    }
  }
}
