require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const config = require("./config/index");

const { userRouter } = require("./routes/user");
const { blogRouter } = require("./routes/blog");

const { controlHomePageRender } = require("./controllers/home");
const { attachUserIfPresent } = require("./middlewares/authentication");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = config.PORT;

mongoose
  .connect(config.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => console.log(`connection failed: ${err.message}`));


app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());  // converts all cookies into an object like structure
app.use(express.static(path.resolve('./public')));
app.use(attachUserIfPresent('sessionToken'));

app.get('/', controlHomePageRender);

app.use('/user', userRouter);

app.use('/blog', blogRouter);

// Catch-all 404
app.use((req, res, next) => {
  res.status(404).render("error", {
    message: "Page not found.",
    stack: null
  });
});

app.use(errorHandler);