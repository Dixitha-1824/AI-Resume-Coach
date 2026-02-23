# 🚀 AI Resume Coach

A full-stack AI-powered Resume Feedback Platform built using Node.js, Express, MongoDB Atlas, and Groq API.

Users can upload their resumes (PDF/TXT), receive AI-generated feedback, track improvement over time, and view analytics in a dashboard.


## Live Demo
👉 https://ai-resume-coach-desl.onrender.com


#Features

- JWT Authentication (Register/Login)
- Resume Upload (PDF & TXT)
- AI-powered Resume Analysis (Groq API)
- Resume Score Extraction
- MongoDB Atlas Cloud Database
- Dashboard with Analysis History
- Resume Feedback Modal View
- Deployed on Render

## Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Multer
- Groq SDK

**Frontend**
- EJS
- HTML
- CSS
- Vanilla JavaScript

## Authentication Flow

- User registers
- Password hashed using bcrypt
- JWT token generated on login
- Protected routes using middleware
- Token stored in localStorage


## Resume Analysis Flow

1. User uploads resume  
2. Resume parsed using pdf-parse  
3. Cleaned text sent to Groq API  
4. AI returns structured feedback  
5. Score extracted using Regex  
6. Saved in MongoDB  
7. Displayed in Dashboard  


## Deployment

- Backend deployed on Render  
- Database hosted on MongoDB Atlas  


## Future Improvements

- Score trend graph  
- PDF feedback export  
- Resume version comparison  
- Role-based skill suggestion engine  
