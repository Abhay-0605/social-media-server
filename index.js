// server/index.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";


const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    // origin: "http://localhost:5173",
    origin:process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: "lax",   // 🔥 ADD THIS
        secure: false      // 🔥 ADD THIS (true only in production with HTTPS)
    }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);

// MongoDB connect + Server start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected!");
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch(err => console.log(err));