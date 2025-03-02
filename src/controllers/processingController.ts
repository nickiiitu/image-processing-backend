import { Request, Response } from "express";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import { ProcessingRequest, ProductData, ProcessingStatus } from "../types";
import { ProcessingRequest as ProcessingRequestModel } from "../models/ProcessingRequest";
import { ImageProcessor } from "../services/imageProcessor";

export class ProcessingController {
  static async uploadCSV(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No CSV file provided" });
        return;
      }

      const products: ProductData[] = [];
      let totalImages = 0;

      // Parse CSV
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ",",
      });

      parser.on("readable", () => {
        let record: any;
        while ((record = parser.read())) {
          const inputImageUrls = record["Input Image URLs"]
            .split(",")
            .map((url: string) => url.trim());

          if (inputImageUrls.length === 0) {
            console.error("No valid URLs found in record:", record);
            continue;
          }

          totalImages += inputImageUrls.length;

          products.push({
            serialNumber: record["Serial Number"] || record["SerialNumber"],
            productName: record["Product Name"] || record["ProductName"],
            inputImageUrls,
          });
        }
      });

      const requestId = uuidv4();

      parser.on("end", async () => {
        const processingRequest = new ProcessingRequestModel({
          requestId,
          status: ProcessingStatus.PENDING,
          totalImages,
          products,
        });
        console.log(processingRequest, "processingRequest");

        await processingRequest.save();

        // Start processing asynchronously
        ImageProcessor.processRequest(requestId).catch(console.error);

        res.status(200).json({
          requestId,
          message: "CSV uploaded successfully. Processing started.",
          totalProducts: products.length,
          totalImages,
        });
      });

      parser.on("error", (error) => {
        console.error("CSV parsing error:", error);
        res.status(400).json({ error: "Invalid CSV format" });
      });

      // Feed the file buffer to the parser
      const stream = Readable.from(req.file.buffer.toString());
      stream.pipe(parser);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const request = await ProcessingRequestModel.findOne({ requestId });

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      res.status(200).json({
        requestId: request.requestId,
        status: request.status,
        totalImages: request.totalImages,
        processedImages: request.processedImages,
        progress: `${Math.round(
          (request.processedImages / request.totalImages) * 100
        )}%`,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
