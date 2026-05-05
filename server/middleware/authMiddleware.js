const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // get token from header
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "No token, access denied" });
        }

        // Check if token starts with "Bearer " and extract the actual token
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // attach user to request
        req.user = decoded;

        next();

    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};