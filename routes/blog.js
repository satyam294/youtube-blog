const { Router } = require("express");

const blogRouter = Router();

blogRouter.post('/', (req, res) => {
  console.log(req.body);
  return res.redirect("/");
});

blogRouter.get('/create-new', (req, res) => {
  return res.render("addBlog", {
    user: req.user
  });
});

module.exports = {
  blogRouter,
}