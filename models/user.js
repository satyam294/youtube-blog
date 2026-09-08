const mongoose = require("mongoose");
const { createHmac, randomBytes } = require("crypto");

// schema
const userSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String, 
    required: true,
    unique: true,
  },
  salt: {
    type: String, 
    required: true
  },
  password:{
    type: String,
    required: true,
  },
  profileImageURL: {
    type: String,
    default: "images/default.png",
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  }
}, {timestamps: true});

// model
const User = mongoose.model("user", userSchema);

// middleware before each save
// create() -> user1 = new User({}) -> user1.save();
// using pre -> user1.function() -> user1.save(); 
userSchema.pre("save", function(next) {
  const user = this;  // mongoose attached the user to this

  if(!isModified("password")) {  // run hash only when the password field is modified
    return next();
  }

  const salt = randomBytes(16).toString();
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  user.salt = salt;
  user.password = hashedPassword;
  next();
});

module.exports = {
  User,
};