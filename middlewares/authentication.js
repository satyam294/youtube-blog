const { verifyToken } = require("../services/authentication");

function attachUserIfPresent(cookieName) {
  return function(req, res, next) {
    const token = req.cookies[cookieName];
    if(!token) return next();

    const userPayload = verifyToken(token);
    req.user = userPayload;

    next();
  }
}

module.exports = {
  attachUserIfPresent,
}

