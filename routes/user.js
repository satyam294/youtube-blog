const { Router } = require("express");
const { User } = require("../models/user");

const userRouter = Router();

userRouter.get("/signup", (req, res) => {
  return res.render("signup");
});

userRouter.get("/signin", (req, res) => {
  return res.render("signin");
});

userRouter.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
  });

  return res.redirect("/");
});

module.exports = {
  userRouter,
}