const { Router } = require("express");
const { requireAuth } = require("../middlewares/authentication");
const uploadBlogCoverImage = require("../middlewares/uploadBlogCoverImage");
const {
  controlBlogCreation,
  controlNewBlogPage,
  controlBlogRetrieval,
  controlBlogCommentCreation,
} = require("../controllers/blog");

const blogRouter = Router();

blogRouter.post('/', requireAuth, uploadBlogCoverImage.single("coverImage"), controlBlogCreation);

blogRouter.get('/create-new', requireAuth, controlNewBlogPage);

blogRouter.get('/:blogId', controlBlogRetrieval);

blogRouter.post('/:blogId/comment', requireAuth, controlBlogCommentCreation);

module.exports = {
  blogRouter,
}