# Full Stack TODO App - Raigoneer

A real-time collaborative TODO application with Google Calendar integration, built with the MERN stack (MongoDB, Express.js, React, Node.js) and enhanced with Socket.IO for real-time updates.

![Todo App Screenshot](https://example.com/your-app-screenshot.png)

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Real-time Updates**: Instantly see changes from other users via Socket.IO
- **Todo Management**: Create, update, delete, and filter todos
- **Categorization**: Organize todos with custom categories
- **Due Date Notifications**: Get reminders for upcoming tasks
- **Attachments**: Add files to your todos
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React**: UI library
- **Redux**: State management
- **Material-UI**: Component library for modern UI
- **Socket.IO Client**: Real-time communication
- **Axios**: HTTP client
- **date-fns**: Date utility library

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional event-based communication
- **JWT**: Authentication mechanism
- **Multer**: File upload handling

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- MongoDB database
- Git

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/real-time-todo-app.git
   cd real-time-todo-app/todo-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `todo-backend` directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../todo-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `todo-frontend` directory with the following variables:
   ```
   REACT_APP_BACKEND_BASE_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

5. Open your browser and visit `http://localhost:3000`

## 🧪 Test Credentials

You can use these credentials to test the application:

- **Email**: aftab48554@gmail.com
- **Password**: 1234

## 📚 API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object with JWT token

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object with JWT token

### Todo Endpoints

#### Get All Todos
- **URL**: `/api/todos`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of todo objects

#### Create Todo
- **URL**: `/api/todos`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "title": "Complete project",
    "dueDate": "2023-12-31",
    "dueTime": "18:00",
    "priority": "High",
    "category": "5f8a26a3b2ff7a0017a34252",
    "notificationSettings": {
      "enableNotifications": true,
      "reminderTime": 30
    }
  }
  ```
- **Response**: Created todo object

#### Update Todo
- **URL**: `/api/todos/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Todo fields to update
- **Response**: Updated todo object

#### Delete Todo
- **URL**: `/api/todos/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

#### Toggle Todo Completion
- **URL**: `/api/todos/:id/toggle`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Updated todo object

### Category Endpoints

#### Get All Categories
- **URL**: `/api/categories`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Array of category objects

#### Create Category
- **URL**: `/api/categories`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "name": "Work",
    "color": "#4caf50",
    "isDefault": false
  }
  ```
- **Response**: Created category object

#### Update Category
- **URL**: `/api/categories/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Category fields to update
- **Response**: Updated category object

#### Delete Category
- **URL**: `/api/categories/:id`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Success message

## 🔄 Real-time Communication

The application uses Socket.IO for real-time updates. Here are the main events:

### Client-side events (emitted to server)
- `authenticate`: Sent when a user logs in, with JWT token
- `disconnect`: Sent when a user logs out or closes the application

### Server-side events (emitted to client)
- `authenticated`: Sent when authentication is successful
- `todoAdded`: Sent when a new todo is added by any user
- `todoUpdated`: Sent when a todo is updated by any user
- `todoDeleted`: Sent when a todo is deleted by any user
- `notification`: Sent when a todo due date is approaching

## 🏗️ Project Architecture

```
project-root/
│
├── todo-frontend/               # React frontend
│   ├── public/                  # Static files
│   │   ├── components/          # React components
│   │   ├── context/             # React context providers
│   │   ├── pages/               # Page components
│   │   ├── redux/               # Redux store and slices
│   │   ├── services/            # API services
│   │   ├── utils/               # Utility functions
│   │   ├── App.js               # Main application component
│   │   └── index.js             # Entry point
│   └── package.json             # Dependencies and scripts
│
└── todo-backend/                # Node.js backend
    ├── config/                  # Configuration files
    ├── controllers/             # Request handlers
    ├── middleware/              # Express middleware
    ├── models/                  # Mongoose models
    ├── routes/                  # API routes
    ├── services/                # Business logic
    ├── utils/                   # Utility functions
    ├── server.js                # Entry point
    └── package.json             # Dependencies and scripts
```

## 🐛 Known Issues & Potential Improvements

### Known Issues
1. Occasional socket disconnection when the browser is inactive for a long time
2. Duplicate todos can appear when multiple users create todos simultaneously
3. Notification timing might be slightly off (±1 minute) due to server polling
4. CORS issues may occur in certain production environments
5. Categories might not load properly in production on first login

### Potential Improvements
1. **Performance Optimization**:
   - Implement pagination for todos to improve load times
   - Add caching for frequently accessed data

2. **User Experience**:
   - Add drag-and-drop functionality for todo reordering
   - Implement dark mode
   - Add more comprehensive notification settings
   - Integrate with more calendar providers (not just Google)

3. **Architecture**:
   - Migrate to TypeScript for better type safety
   - Add comprehensive test coverage
   - Implement proper error boundaries in React components
   - Improved offline support with service workers

4. **Security**:
   - Add rate limiting to prevent abuse
   - Implement refresh tokens for authentication
   - Add CSRF protection

## 📱 Deployment

The application is deployed at:
- Frontend: https://real-time-todo-app-sync-with-google-calender.vercel.app
- Backend: https://real-time-todo-app-sync-with-google.onrender.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Raigoneer - [GitHub Profile](https://github.com/aftab0575) 
