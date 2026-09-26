const { Blog } = require("../models/blog");
const { Comment } = require("../models/comment");
const { marked } = require("marked");
const { mongoose } = require("mongoose");
const AppError = require("../services/AppError");
const sanitizeMarkdownHtml = require("../services/sanitize");

async function controlBlogCreation(req, res) {
  const { body, title } = req.body;

  const coverImageURL = req.file
    ? `/uploads/${req.user._id}/${req.file.filename}`
    : '/images/default_blog.png';  

  const blog = await Blog.create({
    title,
    body,
    coverImageURL,
    createdBy: req.user._id,
  });

  return res.redirect(`/blog/${blog._id}`);
}

async function controlBlogRetrieval(req, res) {
  const blogId = req.params.blogId;
  if (!mongoose.isValidObjectId(blogId)) {
    throw new AppError(404, "Blog not found.");
  }

  const blog = await Blog.findById(blogId).populate("createdBy");
  if (!blog) {
    throw new AppError(404, "Blog not found.");
  }

  const comments = await Comment.find({ blogId: req.params.blogId }).populate("createdBy");

  const html = marked(blog.body);
  const sanitizedHtml = sanitizeMarkdownHtml(html);
  blog.body = sanitizedHtml;

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
}

async function controlBlogCommentCreation(req, res) {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });

  return res.redirect(`/blog/${req.params.blogId}`);
}

function controlNewBlogPage(req, res) {
  return res.render("addBlog", {
    user: req.user
  });
}

module.exports = {
  controlBlogCreation,
  controlBlogRetrieval,
  controlBlogCommentCreation,
  controlNewBlogPage,
}