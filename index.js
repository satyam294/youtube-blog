const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const { userRouter } = require("./routes/user");
const { blogRouter } = require("./routes/blog");

const { Blog } = require("./models/blog");

const { attachUserIfPresent } = require("./middlewares/authentication");

const app = express();
const PORT = 8000;

mongoose
  .connect("mongodb://localhost:27017/blogify")
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => console.log(`connection failed: ${err.message}`)); 


app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());  // converts all cookies into an object like structure
app.use(express.static(path.resolve('./public')));
app.use(attachUserIfPresent('sessionToken'));

app.get('/', async (req, res) => {
  const blogs = await Blog.find({});
  return res.render("home", {
    user: req.user,
    blogs,
  });
});

app.use('/user', userRouter);

app.use('/blog', blogRouter);