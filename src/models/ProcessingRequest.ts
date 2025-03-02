import mongoose from 'mongoose';
import { ProcessingStatus } from '../types';

const productDataSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true },
  productName: { type: String, required: true },
  inputImageUrls: [{ type: String, required: true }],
  outputImageUrls: [{ type: String }]
});

const processingRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: Object.values(ProcessingStatus),
    default: ProcessingStatus.PENDING
  },
  totalImages: { type: Number, required: true },
  processedImages: { type: Number, default: 0 },
  products: [productDataSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

processingRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ProcessingRequest = mongoose.model('ProcessingRequest', processingRequestSchema);
