const { verifyToken } = require("../services/authentication");
const config = require("../config/index");

function attachUserIfPresent(cookieName) {
  return function(req, res, next) {
    const token = req.cookies[cookieName];
    if(!token) return next();

    try {
      const userPayload = verifyToken(token);
      req.user = userPayload;
      next();
    } catch(err) {
      req.user = undefined;
      // Remove the invalid cookie from the browser.
      res.clearCookie("sessionToken", config.COOKIE_OPTIONS);

      // Log the actual reason on the server.
      if (err.name === "TokenExpiredError") {
        console.log("Expired authentication token");
      } else if (err.name === "JsonWebTokenError") {
        console.log("Invalid/tampered authentication token");
      } else {
        console.log("Authentication token verification failed:", err.message);
      }

      return next();
    }
  }
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.redirect("/user/signin");
    }

    next();
}

module.exports = {
  attachUserIfPresent,
  requireAuth,
}

