// server/routes/users.js
import express from "express";
import User from "../models/User.js";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../config/cloudinary.js";
const router = express.Router();



// Users search karo
router.get("/search/:query", isAuth, async (req, res) => {
    try {
        const users = await User.find({
            username: { $regex: req.params.query, $options: "i" }
        }).select("username profilePic");

         res.json(users);
       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Profile update karo
router.put("/update", isAuth, upload.single("image"), async (req, res) => {
    try {
        const { username, bio } = req.body;
       { console.log(username)}
        const updateData = { username, bio };

        // Image upload hui hai?
        if (req.file) {
            updateData.profilePic = req.file.path;  // Cloudinary URL
        }

        const updated = await User.findByIdAndUpdate(
            req.session.userId,
            updateData,
            { new: true }
        ).select("-password");

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// User profile fetch karo
router.get("/:id", isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("followers", "username profilePic")
            .populate("following", "username profilePic");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Follow / Unfollow toggle
router.put("/:id/follow", isAuth, async (req, res) => {
    try {
        if (req.params.id === req.session.userId.toString()) {
            return res.status(400).json({ message: "Khud ko follow nahi kar sakte!" });
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.session.userId);

        if (!userToFollow) return res.status(404).json({ message: "User not found" });

        const alreadyFollowing = currentUser.following.includes(req.params.id);

        if (alreadyFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== req.params.id
            );
            userToFollow.followers = userToFollow.followers.filter(
                id => id.toString() !== req.session.userId.toString()
            );
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            userToFollow.followers.push(req.session.userId);
        }

        await currentUser.save();
        await userToFollow.save();

        res.json({ message: alreadyFollowing ? "Unfollowed" : "Followed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



export default router;