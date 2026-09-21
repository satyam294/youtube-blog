const { User } = require("../models/user");
const { createToken } = require("../services/authentication");
const { isSafeRoute } =require("../services/safeRoute");
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
  const { email, password, returnTo } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.matchPassword(password)) {
    return res.status(401).redirect(`/user/signin?status=401&returnTo=${encodeURIComponent(returnTo || "")}`);
  }

  const token = createToken(user);
  res.cookie('sessionToken', token, config.COOKIE_OPTIONS);

  if(isSafeRoute(returnTo)){
    return res.redirect(returnTo);
  }

  return res.redirect("/");
}

function controlUserLogout(req, res) {
  return res.clearCookie("sessionToken", config.COOKIE_OPTIONS).redirect("/");
}

module.exports = {
  controlUserCreation,
  controlUserValidation,
  controlUserLogout
}