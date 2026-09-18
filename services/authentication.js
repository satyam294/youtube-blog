const JWT = require('jsonwebtoken');
const config = require("../config/index");

function createToken(user) {
  const payload = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profileImageURL: user.profileImageURL,
    role: user.role,
  };

  const token = JWT.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
  return token;
}

function verifyToken(token) {
  const payload = JWT.verify(token, config.JWT_SECRET);
  return payload;
}

module.exports = {
  createToken,
  verifyToken,
}