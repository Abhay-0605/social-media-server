// server/routes/posts.js
import express from "express";
import Post from "../models/Post.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

// Sare posts fetch karo — Feed
router.get("/", isAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "username profilePic")
            .populate("comments.user", "username profilePic")
            .sort({ createdAt: -1 });  // latest pehle

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post banao
router.post("/", isAuth, async (req, res) => {
    try {
        console.log(req.body,"body this:");
        const { text, image } = req.body;
        console.log(req.session,"session")
        const post = await Post.create({
            user: req.session.userId,
            text,
            image
        });
        console.log(post,"post");
        // populate karke bhejo — frontend ko user info chahiye
        const populated = await post.populate("user", "username profilePic");
       
        console.log(populated,"pop");
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post delete karo
router.delete("/:id", isAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Sirf apni post delete kar sako
        if (post.user.toString() !== req.session.userId.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await post.deleteOne();
        res.json({ message: "Post deleted", id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Like / Unlike toggle
router.put("/:id/like", isAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
       
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.session.userId.toString();
        const alreadyLiked = post.likes.some(id => id.toString() === userId);

        if (alreadyLiked) {
            // Unlike karo
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            // Like karo
            post.likes.push(req.session.userId);
        }

        await post.save();
        const populated = await post.populate([
            { path: "user", select: "username profilePic" },
            { path: "comments.user", select: "username profilePic" }
        ]);

        res.json(populated);
       
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Comment add karo
router.post("/:id/comment", isAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.comments.push({
            user: req.session.userId,
            text: req.body.text
        });

        await post.save();

        // populate karke bhejo
        const populated = await post.populate("comments.user", "username profilePic");
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Comment delete karo
router.delete("/:id/comment/:commentId", isAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Sirf apna comment delete kar sako
        if (comment.user.toString() !== req.session.userId.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        comment.deleteOne();
        await post.save();
        const populated = await post.populate([
            { path: "user", select: "username profilePic" },
            { path: "comments.user", select: "username profilePic" }
        ]);
    
        res.json(populated);
    
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get("/user/:userId", isAuth, async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate("user", "username profilePic")
            .populate("comments.user", "username profilePic")
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;