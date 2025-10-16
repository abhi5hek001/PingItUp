# Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.io.

## Features

- 🔒 User authentication (Sign up, Login, Logout)
- 💬 Real-time messaging with Socket.io
- 📷 Profile picture upload (with image preview and cropping)
- 📨 Send text and image messages
- 🟢 Online users indicator
- 📱 Responsive design for desktop and mobile
- 🗂️ Sidebar with user list and notifications
- 🌈 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend:** React, Tailwind CSS, Axios, React Hot Toast
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, Cloudinary (for image uploads)
- **Authentication:** JWT & HTTP-only cookies

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
```

- Create a `.env` file in the `backend` folder with the following:
  ```
  MONGO_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  CLOUDINARY_CLOUD_NAME=your_cloudinary_name
  CLOUDINARY_API_KEY=your_cloudinary_api_key
  CLOUDINARY_API_SECRET=your_cloudinary_api_secret
  CLIENT_URL=http://localhost:5173
  ```

- Start the backend server:
  ```bash
  npm run dev
  ```

### Frontend Setup

```bash
cd ../frontend
npm install
```

- Start the frontend development server:
  ```bash
  npm run dev
  ```

- The app will be available at [http://localhost:5173](http://localhost:5173)


## Usage

1. Register a new account or login with existing credentials.
2. Upload a profile picture.
3. Start chatting with other users in real time.
4. Send text or image messages.
5. See online users and notifications.

