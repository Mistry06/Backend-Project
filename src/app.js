import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// Add this line
console.log("app.js: App initialization started.");

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Add this line
console.log("app.js: Middleware setup complete.");

//routes
// IMPORTANT: Make sure this import matches your export from userRoute.js
// If userRoute.js has 'export default router;', then this is correct:
import userRouter from './routes/userRoute.js' // Changed from 'Router' to 'userRouter' for clarity

// Add these lines
console.log("app.js: Importing userRouter from './routes/userRoute.js'.");
console.log("app.js: Type of imported userRouter:", typeof userRouter); // Should be 'function'

app.use('/api', userRouter) // Use the imported 'userRouter' variable here

// Add this line
console.log("app.js: /api route configured with userRouter.");
// This will show you the router object itself. It should be complex.
console.log("app.js: The userRouter object is:", userRouter);

export {app}