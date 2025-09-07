
# YouTube Clone – Content Creation Backend

## Overview
This project is the backend of a video-sharing platform similar to YouTube. It is built using Node.js, Express, and MongoDB. The backend handles user authentication, video uploads, and media management while ensuring security and scalability.

## Features
- ✅ User authentication with JWT  
- ✅ Video uploads with Cloudinary  
- ✅ Secure API endpoints with CORS and cookie handling  
- ✅ Efficient data handling with pagination and aggregation  
- ✅ Environment-based configuration using dotenv  
- ✅ Error handling and request parsing  
- ✅ Prettier for code formatting and maintainability

## Tech Stack
- **Node.js**  
- **Express.js**  
- **MongoDB & Mongoose**  
- **Cloudinary** (for media storage)  
- **JWT (jsonwebtoken)** (for authentication)  
- **Multer** (for file uploads)  
- **bcrypt** (for password hashing)  
- **dotenv** (for environment variables)

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your environment variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Run the server:
   ```bash
   npm run dev
   ```

## Usage
- Register and login users
- Upload and manage videos
- Secure API endpoints using tokens
- View paginated video lists

## Outcome
A fully functional, secure, and scalable backend that powers a video-sharing platform with efficient user and media management.

## License
This project is licensed under the ISC License.
