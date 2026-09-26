const sanitizeHtml = require("sanitize-html");

const sanitizeOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",

    "p",
    "br",

    "strong",
    "em",
    "u",
    "s",

    "blockquote",

    "ul",
    "ol",
    "li",

    "a",
    "img",

    "pre",
    "code",

    "hr"
  ],

  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    code: ["class"]
  },

  allowedSchemes: ["http", "https", "mailto"],

  allowedSchemesByTag: {
    img: ["http", "https"]
  }
};

function sanitizeMarkdownHtml(html) {
  return sanitizeHtml(html, sanitizeOptions);
}

module.exports = sanitizeMarkdownHtml;