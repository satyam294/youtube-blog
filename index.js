const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const { userRouter } = require("./routes/user");

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

app.get('/', (req, res) => {
  return res.render("home");
});

app.use('/user', userRouter);