import { Request, Response } from "express";
import { ProcessingRequest } from "../models/ProcessingRequest";

export class WebhookController {
  static async handleProcessingComplete(req: Request, res: Response) {
    try {
      const { requestId, status, totalImages, processedImages, products } = req.body;

      console.log("\n=== Processing Completion Webhook ===");
      console.log(`RequestID: ${requestId}`);
      console.log(`Status: ${status}`);
      console.log(`Total Images: ${totalImages}`);
      console.log(`Processed Images: ${processedImages}`);
      console.log("\nProcessed Products:");
      
      products.forEach((product: any, index: number) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  Serial Number: ${product.serialNumber}`);
        console.log(`  Name: ${product.productName}`);
        console.log(`  Input URLs: ${product.inputImageUrls.length}`);
        console.log(`  Output URLs: ${product.outputImageUrls?.length || 0}`);
      });
      
      console.log("\n=== End Webhook Notification ===\n");

      res.status(200).json({
        message: "Webhook received successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  }
}
