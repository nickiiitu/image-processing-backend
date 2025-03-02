# Image Processing System

A Node.js backend system for processing image data from CSV files with asynchronous processing capabilities.

## Features

- CSV file upload and validation
- Asynchronous image processing (50% compression)
- MongoDB storage for processed images and request tracking
- Status tracking via request ID
- Webhook support for process completion notifications

## Tech Stack

- Node.js
- MongoDB (NoSQL Database)
- Express.js
- Bull (Redis-based queue)
- Sharp (Image processing)
- Multer (File upload)
- CSV Parser

## API Endpoints

### 1. Upload CSV
- **POST** `/api/upload`
- Accepts CSV file with columns: Serial Number, Product Name, Input Image URLs
- Returns request ID for tracking

### 2. Check Status
- **GET** `/api/status/:requestId`
- Returns current processing status

### 3. Webhook (Optional)
- **POST** `/api/webhook`
- Configurable webhook for process completion notification

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/image-processor
REDIS_URL=redis://localhost:6379
```
