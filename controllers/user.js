const { User } = require("../models/user");
const { createToken } = require("../services/authentication");
const { isSafeRoute } = require("../services/safeRoute");
const config = require("../config/index");
const AppError = require("../services/AppError");
const { Blog } = require("../models/blog");

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
    profileComplete: true
  };

  if (bio !== undefined && bio.length !== 0) {
    updateData.bio = bio?.trim() || "";
  }

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
  if (!user) throw new AppError(404, "User not found.");

  const blogs = await Blog.find({
    createdBy: user._id
  });

  return res.render("profile", {
    user,
    blogs,
  });
}

async function controlUserEditRender(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(404, "User not found.");

  return res.render("editProfile", { user });
}

async function controlUserEdit(req, res) {
  const updateData = {};
  const { fullName, email, bio } = req.body || {};

  if (fullName !== undefined) {
    if (typeof fullName !== "string") {
      throw new AppError(400, "Full name must be text.");
    }
    const normalizedFullName = fullName.trim();
    if (!normalizedFullName) throw new AppError(400, "Full name cannot be empty.");
    updateData.fullName = normalizedFullName;
  }

  if (email !== undefined) {
    if (typeof email !== "string") {
      throw new AppError(400, "Email address must be text.");
    }
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError(400, "Enter a valid email address.");
    }
    updateData.email = normalizedEmail;
  }

  if (bio !== undefined) {
    if (typeof bio !== "string") {
      throw new AppError(400, "Bio must be text.");
    }
    const normalizedBio = bio.trim();
    if (normalizedBio.length > 300) {
      throw new AppError(400, "Bio must be 300 characters or fewer.");
    }
    updateData.bio = normalizedBio;
  }

  if (req.file) {
    updateData.profileImageURL = `/uploads/${req.user._id}/${req.file.filename}`;
  }

  if (Object.keys(updateData).length === 0) {
    return res.redirect("/user/profile");
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!user) throw new AppError(404, "User not found.");
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "An account with this email address already exists.");
    }
    throw err;
  }

  return res.redirect("/user/profile");
}

module.exports = {
  controlUserCreation,
  controlUserValidation,
  controlUserLogout,
  controlProfileRender,
  controlProfileCompletion,
  controlUserEditRender,
  controlUserEdit,
};