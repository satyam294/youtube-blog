const { Blog } = require("../models/blog");

async function controlHomePageRender(req, res) {
  const blogs = await Blog.find({});

  return res.render("home", {
    user: req.user,
    blogs,
  });
}

module.exports = {
  controlHomePageRender,
}