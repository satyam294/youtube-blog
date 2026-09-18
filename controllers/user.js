const { User } = require("../models/user");
const { createToken } = require("../services/authentication");
const config = require("../config/index");

async function controlUserCreation (req, res) {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
    salt: "default_salt",
  });

  return res.redirect("/");
}

async function controlUserValidation (req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.matchPassword(password)) {
    return res.status(401).redirect("/user/signin?status=401");
  }

  const token = createToken(user);
  return res.cookie('sessionToken', token, config.COOKIE_OPTIONS).redirect("/");
}

function controlUserLogout(req, res) {
  return res.clearCookie("sessionToken", config.COOKIE_OPTIONS).redirect("/");
}

module.exports = {
  controlUserCreation,
  controlUserValidation,
  controlUserLogout
}