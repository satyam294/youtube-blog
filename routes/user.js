const { Router } = require("express");
const { requireAuth } = require("../middlewares/authentication");
const uploadProfileImage = require("../middlewares/uploadProfileImage");
const { 
  controlUserValidation, 
  controlUserCreation, 
  controlUserLogout,
  controlProfileRender,
  controlProfileCompletion, 
} = require("../controllers/user");

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

userRouter.get("/profile", requireAuth, controlProfileRender);

userRouter.get("/profile/setup", requireAuth, (req, res) => {
  return res.render("profile-setup", {
    user: req.user,
  });
});

userRouter.post(
  "/profile/setup", 
  requireAuth,
  uploadProfileImage.single("profileImage"), 
  controlProfileCompletion
);

module.exports = {
  userRouter,
}