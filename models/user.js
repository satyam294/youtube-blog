const { model, Schema } = require("mongoose");
const { createHmac } = require("crypto");
const bcrypt = require("bcrypt");

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
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
  },
  profileImageURL: {
    type: String,
    default: "/images/default.png",
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  },
  bio: {
    type: String,
    default: "I read blogs.",
    maxlength: 300
  },
  profileComplete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// middleware before each save
// create() -> user1 = new User({}) -> user1.save();
// using pre -> user1.function() -> user1.save(); 
userSchema.pre("save", async function () {
  const user = this;  // mongoose attached the user to this

  if (!user.isModified("password")) {  // run hash only when the password field is modified
    return;
  }

  // Hash whatever plaintext password is currently in the document.
  user.password = await bcrypt.hash(user.password, 12);
});

// virtuals -> property getters and setter, ones that are not explicitly stored in the document(e.g. first name)
// statics -> methods that invlove the entire Model (e.g. User.findByEmail())
// methods -> instance methods that are performed using a single document (e.g. user1.verifyPass())

userSchema.methods.matchPassword = async function (enteredPass) {
  if (this.salt) {
    const salt = this.salt;

    const givenHashedPassword = createHmac("sha256", salt)
      .update(enteredPass)
      .digest("hex");

    if(givenHashedPassword !== this.password) return false;

    // Correct legacy password.
    // Put the plaintext password into `password`.
    // pre("save") will bcrypt-hash it.
    this.salt = undefined;
    this.password = enteredPass;

    await this.save();
    return true;
  }
  
  return await bcrypt.compare(enteredPass, this.password);
}

// model
const User = model("user", userSchema);

module.exports = {
  User,
};