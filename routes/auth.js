// server/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Sare fields required hain!" });
        }

        if (username.length < 3) {
            return res.status(400).json({ message: "Username kam se kam 3 characters ka hona chahiye!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password kam se kam 6 characters ka hona chahiye!" });
        }

        // Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Valid email enter karo!" });
        }

        // Already exist karta hai?
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already exists" });

        // Password hash karo
        const hashedPassword = await bcrypt.hash(password, 10);

        // User banao
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Session set karo
        req.session.userId = user._id;

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            followers: user.followers,
            following: user.following
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // User dhundho
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // Password check karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Session set karo
        req.session.userId = user._id;

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            followers: user.followers,
            following: user.following
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout
router.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

// Session check — app load pe
router.get("/me", isAuth, async (req, res) => {
 

    try {
        const user = await User.findById(req.session.userId).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;