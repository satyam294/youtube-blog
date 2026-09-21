const { Router } = require("express");
const { controlUserValidation, controlUserCreation, controlUserLogout } = require("../controllers/user");

const userRouter = Router();

userRouter.get("/signup", (req, res) => {
  return res.render("signup");
});

userRouter.get("/signin", (req, res) => {
  const tryAgain = req.query.status === "401";
  const returnTo = req.query.returnTo;
  return res.render("signin", { tryAgain, returnTo });
});

userRouter.post("/signup", controlUserCreation);

userRouter.post("/signin", controlUserValidation);

userRouter.get("/logout", controlUserLogout);

module.exports = {
  userRouter,
}