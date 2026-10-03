const { User } = require("../models/user");
const { createToken } = require("../services/authentication");
const { isSafeRoute } = require("../services/safeRoute");
const config = require("../config/index");
const AppError = require("../services/AppError");

async function controlUserCreation(req, res) {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) throw new AppError(409, "Missing Fields");

  try {
    const user = await User.create({
      fullName,
      email,
      password,
    });

    const token = createToken(user);
    res.cookie('sessionToken', token, config.COOKIE_OPTIONS);

    return res.redirect("/user/profile/setup");
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "User with this email already exists.");
    }

    throw err;
  }
}

async function controlUserValidation(req, res) {
  const { email, password, returnTo } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).redirect(`/user/signin?status=401&returnTo=${encodeURIComponent(returnTo || "")}`);
  }

  const token = createToken(user);
  res.cookie('sessionToken', token, config.COOKIE_OPTIONS);

  if (isSafeRoute(returnTo)) {
    return res.redirect(returnTo);
  }

  return res.redirect("/");
}

function controlUserLogout(req, res) {
  return res.clearCookie("sessionToken", config.COOKIE_OPTIONS).redirect("/");
}

async function controlProfileCompletion(req, res) {
  const { bio } = req.body;

  const updateData = {
    bio: bio?.trim() || "",
    profileComplete: true
  };

  // If user uploaded an image
  if (req.file) {
    updateData.profileImageURL = `/uploads/${req.user._id}/${req.file.filename}`;
  }

  await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    {
      returnDocument: "after",
      runValidators: true
    }
  );

  return res.redirect("/");
}

async function controlProfileRender(req, res) {
  const user = await User.findById(req.user._id);
  return res.render("profile", {
    user,
  });
}

module.exports = {
  controlUserCreation,
  controlUserValidation,
  controlUserLogout,
  controlProfileRender,
  controlProfileCompletion,
}