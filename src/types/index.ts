export interface ProductData {
  serialNumber: string;
  productName: string;
  inputImageUrls: string[];
  outputImageUrls?: string[];
}

export interface ProcessingRequest {
  requestId: string;
  status: ProcessingStatus;
  totalImages: number;
  processedImages: number;
  products: ProductData[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface WebhookPayload {
  requestId: string;
  status: ProcessingStatus;
  completedAt: Date;
  totalProducts: number;
  totalImages: number;
}
