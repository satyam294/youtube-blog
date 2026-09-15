const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { marked } = require("marked");

const { Blog } = require("../models/blog");

const blogRouter = Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.resolve(`./public/uploads/${req.user._id}`);

    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});  //recursive = make all the necessary directories in the path
    }

    return cb(null, dir);
  }, 
  filename: function(req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({storage});

blogRouter.post('/', upload.single("coverImage"), async (req, res) => {
  const { body, title } = req.body;

  const blog = await Blog.create({
    title,
    body,
    coverImageURL: `/uploads/${req.user._id}/${req.file.filename}`,
    createdBy: req.user._id,
  });

  return res.redirect(`/blog/${blog._id}`);
});

blogRouter.get('/create-new', (req, res) => {
  return res.render("addBlog", {
    user: req.user
  });
});

blogRouter.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  blog.body = marked(blog.body);

  return res.render("blog", {
    user: req.user,
    blog,
  });
});

module.exports = {
  blogRouter,
}