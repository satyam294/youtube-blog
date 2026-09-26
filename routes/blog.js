const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth } = require("../middlewares/authentication");
const AppError = require("../services/AppError");
const {
  controlBlogCreation,
  controlNewBlogPage,
  controlBlogRetrieval,
  controlBlogCommentCreation,
} = require("../controllers/blog");

const blogRouter = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.resolve(`./public/uploads/${req.user._id}`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });  //recursive = make all the necessary directories in the path
    }

    return cb(null, dir);
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new AppError(415, "Unsupported file type");
    cb(error, false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

blogRouter.post('/', requireAuth, upload.single("coverImage"), controlBlogCreation);

blogRouter.get('/create-new', requireAuth, controlNewBlogPage);

blogRouter.get('/:blogId', controlBlogRetrieval);

blogRouter.post('/:blogId/comment', requireAuth, controlBlogCommentCreation);

module.exports = {
  blogRouter,
}