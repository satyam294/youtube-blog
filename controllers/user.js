const { User } = require("../models/user");
const { createToken } = require("../services/authentication");

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
  return res.cookie('sessionToken', token).redirect("/");
}

function controlUserLogout(req, res) {
  return res.clearCookie("sessionToken").redirect("/");
}

module.exports = {
  controlUserCreation,
  controlUserValidation,
  controlUserLogout
}