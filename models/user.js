const { model, Schema } = require("mongoose");
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
    default: "/images/default.png",
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    default: "USER",
  }
}, {timestamps: true});

// middleware before each save
// create() -> user1 = new User({}) -> user1.save();
// using pre -> user1.function() -> user1.save(); 
userSchema.pre("save", function() {
  const user = this;  // mongoose attached the user to this

  if(!user.isModified("password")) {  // run hash only when the password field is modified
    return;
  }

  const salt = randomBytes(16).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  user.salt = salt;
  user.password = hashedPassword;
});

// virtuals -> property getters and setter, ones that are not explicitly stored in the document(e.g. first name)
// statics -> methods that invlove the entire document (e.g. User.findByEmail())
// methods -> instance methods that are performed using a single document (e.g. user1.verifyPass())

userSchema.methods.matchPassword = function(password) {
  const salt = this.salt;
  const hashedPassword = this.password;

  const givenHashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  
  return givenHashedPassword === hashedPassword;
}

// model
const User = model("user", userSchema);

module.exports = {
  User,
};