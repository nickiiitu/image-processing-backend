# Image Processing System API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication.

## Endpoints

### 1. Upload CSV for Processing
Process multiple images by uploading a CSV file containing image URLs.

```http
POST /upload
Content-Type: multipart/form-data
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| csv | File | Yes | CSV file containing image data |

#### CSV Format
```csv
Serial Number,Product Name,Input Image URLs
P001,Mountain Landscape,"https://example.com/image1.jpg"
P002,Office Setup,"https://example.com/image2.jpg, https://example.com/image3.jpg"
```

#### Success Response
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "PENDING",
  "totalImages": 3,
  "message": "CSV uploaded successfully"
}
```

#### Error Responses
```json
{
  "error": "Invalid CSV format",
  "details": "Missing required columns"
}
```
Status: 400 Bad Request

```json
{
  "error": "Server error",
  "message": "Failed to process CSV"
}
```
Status: 500 Internal Server Error

---

### 2. Check Processing Status
Get the current status of an image processing request.

```http
GET /status/:requestId
```

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| requestId | string | Yes | ID received from upload response |

#### Success Response
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "PROCESSING",
  "processedImages": 2,
  "totalImages": 3,
  "products": [
    {
      "serialNumber": "P001",
      "productName": "Mountain Landscape",
      "inputImageUrls": ["https://example.com/image1.jpg"],
      "outputImageUrls": ["/uploads/507f1f77bcf86cd799439011_0_1646456789.jpg"]
    },
    {
      "serialNumber": "P002",
      "productName": "Office Setup",
      "inputImageUrls": [
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg"
      ],
      "outputImageUrls": [
        "/uploads/507f1f77bcf86cd799439011_1_1646456790.jpg",
        null
      ]
    }
  ]
}
```

#### Status Values
| Status | Description |
|--------|-------------|
| PENDING | Request received, waiting to start processing |
| PROCESSING | Images are being processed |
| COMPLETED | All images have been processed |
| FAILED | Processing failed |

#### Error Responses
```json
{
  "error": "Request not found",
  "message": "No processing request found with the given ID"
}
```
Status: 404 Not Found

```json
{
  "error": "Server error",
  "message": "Failed to fetch status"
}
```
Status: 500 Internal Server Error

---

### 3. Webhook Endpoint
Receive notifications about completed processing requests.

```http
POST /webhook
Content-Type: application/json
```

#### Request Body
```json
{
  "requestId": "507f1f77bcf86cd799439011",
  "status": "COMPLETED",
  "totalImages": 3,
  "processedImages": 3,
  "products": [
    {
      "serialNumber": "P001",
      "productName": "Mountain Landscape",
      "inputImageUrls": ["https://example.com/image1.jpg"],
      "outputImageUrls": ["/uploads/507f1f77bcf86cd799439011_0_1646456789.jpg"]
    }
  ]
}
```

#### Success Response
```json
{
  "message": "Webhook received successfully",
  "timestamp": "2024-03-02T18:30:00.000Z"
}
```

#### Error Response
```json
{
  "error": "Failed to process webhook",
  "message": "Invalid request body"
}
```
Status: 500 Internal Server Error

## Rate Limiting
Currently, there are no rate limits implemented.

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Image Processing Details
- Images are compressed to 50% quality
- Supported formats: JPEG, PNG
- Maximum file size: 10MB per image
- Output format: JPEG

## Example Usage

### cURL Examples

1. Upload CSV:
```bash
curl -X POST \
  -F "csv=@sample.csv" \
  http://localhost:3000/api/upload
```

2. Check Status:
```bash
curl http://localhost:3000/api/status/507f1f77bcf86cd799439011
```

### Node.js Example
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Upload CSV
async function uploadCSV(filePath) {
  const form = new FormData();
  form.append('csv', fs.createReadStream(filePath));
  
  try {
    const response = await axios.post('http://localhost:3000/api/upload', form, {
      headers: form.getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response.data);
  }
}

// Check Status
async function checkStatus(requestId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/status/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Status check failed:', error.response.data);
  }
}
```

## Best Practices

1. **Error Handling**
   - Always check response status codes
   - Handle network errors gracefully
   - Implement proper retry logic

2. **Status Polling**
   - Poll status endpoint at reasonable intervals (e.g., every 5 seconds)
   - Implement exponential backoff for long-running processes
   - Stop polling once COMPLETED or FAILED status is received

3. **CSV Preparation**
   - Ensure URLs are properly formatted
   - Validate image URLs before submission
   - Keep CSV file size reasonable

4. **Webhook Implementation**
   - Implement proper error handling
   - Acknowledge webhook receipts promptly
   - Handle duplicate notifications
