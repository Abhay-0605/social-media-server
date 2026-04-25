// server/middleware/isAuth.js
const isAuth = (req, res, next) => {
    if (req.session.userId) {
     
        next();  // logged in — aage jao
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

export default isAuth;