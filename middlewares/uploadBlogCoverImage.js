const path = require("path");
const fs = require("fs");
const multer = require("multer");
const AppError = require("../services/AppError");

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

const uploadBlogCoverImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
  }
});

module.exports = uploadBlogCoverImage;