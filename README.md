# Image Processing System

A scalable, asynchronous image processing system built with Node.js, featuring parallel processing capabilities, robust error handling, and comprehensive status tracking.

## System Architecture

The system is built with a modular architecture focusing on scalability and maintainability. For detailed technical information, see [DESIGN.md](DESIGN.md).

![Architecture Diagram](architecture.drawio)

## Features

### Core Functionality
- CSV-based batch image processing
- Parallel processing with configurable concurrency
- Automatic image compression (50% quality)
- Progress tracking and status updates
- Webhook notifications for completion events

### Technical Features
- Redis-based job queue for reliable processing
- MongoDB for persistent storage and tracking
- Automatic job retries with exponential backoff
- Detailed logging and error tracking
- Scalable worker processes

## Tech Stack

### Core Technologies
- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Express.js**: Web framework

### Data Storage
- **MongoDB**: Request and status tracking
- **Redis**: Job queue management

### Processing
- **Bull**: Queue management
- **Sharp**: Image processing
- **Multer**: File upload handling
- **CSV-Parse**: CSV processing

## API Documentation

### 1. Upload CSV
```http
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- csv: CSV file with columns (Serial Number, Product Name, Input Image URLs)

Response:
{
  "requestId": "string",
  "status": "PENDING",
  "totalImages": number
}
```

### 2. Check Status
```http
GET /api/status/:requestId

Response:
{
  "status": "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
  "processedImages": number,
  "totalImages": number,
  "products": [
    {
      "serialNumber": "string",
      "productName": "string",
      "inputImageUrls": ["string"],
      "outputImageUrls": ["string"]
    }
  ]
}
```

### 3. Webhook Endpoint
```http
POST /api/webhook

Request Body:
{
  "requestId": "string",
  "status": "string",
  "totalImages": number,
  "processedImages": number,
  "products": [{
    "serialNumber": "string",
    "productName": "string",
    "inputImageUrls": ["string"],
    "outputImageUrls": ["string"]
  }]
}
```

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Redis

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd spyne
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/image-processor
REDIS_URL=redis://localhost:6379
```

5. Start the development server:
```bash
npm run dev
```

## Usage Example

1. Prepare a CSV file with the following format:
```csv
Serial Number,Product Name,Input Image URLs
P001,Mountain Landscape,"https://example.com/image1.jpg"
P002,Office Setup,"https://example.com/image2.jpg, https://example.com/image3.jpg"
```

2. Upload the CSV:
```bash
curl -X POST -F "csv=@sample.csv" http://localhost:3000/api/upload
```

3. Check processing status:
```bash
curl http://localhost:3000/api/status/<requestId>
```

## Performance Considerations

- Configurable number of concurrent processors (default: 5)
- Automatic job retries with exponential backoff
- Memory-efficient streaming for large files
- Redis-based job queue for reliable processing

## Error Handling

- Automatic retries for failed jobs
- Detailed error logging
- Graceful degradation
- CSV validation
- Image URL validation

## Monitoring

- Detailed processing logs
- Job status tracking
- Processing duration metrics
- Webhook notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

