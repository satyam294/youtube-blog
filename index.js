const express = require("express");
const path = require("path");

const { userRouter } = require("./routes/user");

const app = express();
const PORT = 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/', (req, res) => {
  return res.render("home");
});

app.use('/user', userRouter);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));