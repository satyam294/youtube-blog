# YouTube Blog Project Context

## 1. Purpose

This project is a server-rendered blog application called **Blogify**. It allows visitors to browse published blog posts, registered users to sign in, authenticated users to create posts with cover images, and authenticated users to add comments to blog posts.

The application is currently a small monolithic Node.js/Express application. It uses EJS for HTML rendering, MongoDB through Mongoose for persistence, JSON Web Tokens (JWTs) stored in cookies for login sessions, and the local `public` directory for static files and uploaded cover images.

## 2. Technology Stack

- **Runtime:** Node.js
- **Module system:** CommonJS (`require` / `module.exports`)
- **Web framework:** Express 5
- **Template engine:** EJS
- **Database:** MongoDB through Mongoose
- **Authentication:** JWT using `jsonwebtoken`
- **Session transport:** HTTP cookie named `sessionToken`
- **Request parsing:** `express.json`, `express.urlencoded`, and `cookie-parser`
- **File uploads:** Multer with disk storage
- **Markdown rendering:** `marked`
- **Frontend styling:** Bootstrap 5.3 loaded from jsDelivr in the EJS partials
- **Development runner:** Nodemon

Important dependencies are declared in `package.json`; `package-lock.json` records the installed dependency tree.

## 3. Runtime Configuration

`app.js` loads environment variables using `dotenv`.

The application currently expects:

- `MONGO_URL`: MongoDB connection string.
- `PORT`: optional HTTP port. Defaults to `8000` when absent.

The actual `.env` file is ignored by Git and must not be committed. Uploaded files, image files, and `node_modules` are also ignored according to `.gitignore`.

The server starts listening only after the MongoDB connection succeeds. A connection failure is logged and the server is not started.

## 4. Project Structure

```text
app.js                         Application entrypoint and global middleware
package.json                   Scripts and dependency declarations
package-lock.json              Locked dependency versions
controllers/
  user.js                      Signup, signin, and logout controller functions
middlewares/
  authentication.js            Optional JWT-cookie user attachment middleware
models/
  user.js                      User schema, password hashing, password matching
  blog.js                      Blog post schema
  comment.js                   Comment schema
routes/
  user.js                      User page and authentication routes
  blog.js                      Blog creation, display, upload, and comment routes
services/
  authentication.js            JWT creation and verification
views/
  home.ejs                     Blog listing page
  signup.ejs                   Signup form
  signin.ejs                   Signin form and authentication error message
  addBlog.ejs                  New blog form with image upload
  blog.ejs                     Blog detail page and comments
  partials/
    head.ejs                   Bootstrap CSS and document metadata
    navbar.ejs                 Shared navigation and auth-dependent links
    script.ejs                 Bootstrap JavaScript
public/
  images/                      Static image assets, including the default profile image
  uploads/                     User-scoped uploaded cover images
```

## 5. Application Bootstrap and Global Middleware

The application is created in `app.js`.

Startup sequence:

1. Load `.env` values.
2. Create the Express application.
3. Determine the port from `PORT`, defaulting to `8000`.
4. Connect to MongoDB using `MONGO_URL`.
5. Start the HTTP server after a successful database connection.
6. Configure EJS and the `views` directory.
7. Register request parsing and static-file middleware.
8. Attach the optional authenticated user to every request.
9. Register the home route and the `/user` and `/blog` routers.

Global middleware order:

1. `express.json()` parses JSON request bodies.
2. `express.urlencoded({ extended: false })` parses standard HTML form submissions.
3. `cookieParser()` exposes cookies through `req.cookies`.
4. `express.static(...)` serves files from `public` at the site root. For example, `public/uploads/...` is available as `/uploads/...`.
5. `attachUserIfPresent('sessionToken')` checks the login cookie and sets `req.user` when it contains a valid JWT.

There is no global error handler and no general authentication guard. The authentication middleware is an optional context loader rather than an access-control middleware.

## 6. Authentication Design

### User registration

`POST /user/signup` is handled by `controlUserCreation` in `controllers/user.js`.

The controller reads `fullName`, `email`, and `password` from the form body and creates a `User` document. It also supplies `salt: "default_salt"`, but the user model's `pre("save")` hook replaces this with a randomly generated salt before saving. After creation, the user is redirected to `/` and is not automatically signed in.

### Password storage

The user model hashes passwords in a Mongoose `pre("save")` hook:

1. Generate 16 random bytes and convert them to hexadecimal.
2. Use the salt as the HMAC key.
3. Hash the password with SHA-256.
4. Store the generated salt and resulting hash.

`matchPassword(password)` repeats the HMAC operation with the stored salt and compares the result to the stored hash.

### Signin

`POST /user/signin` is handled by `controlUserValidation`:

1. Find a user by email.
2. Reject the request with a `401` redirect to `/user/signin?status=401` if the user does not exist or the password does not match.
3. Create a JWT containing the user's `_id`, `fullName`, `email`, `profileImageURL`, and `role`.
4. Store the JWT in the `sessionToken` cookie.
5. Redirect to `/`.

The signin view displays an invalid-credentials warning when the query parameter `status` is `401`.

### Request-time user attachment

`attachUserIfPresent('sessionToken')` reads `req.cookies.sessionToken` on each request. If no cookie exists, it calls `next()` without setting `req.user`. If a cookie exists, it verifies the JWT and assigns the decoded payload to `req.user`.

The JWT secret is currently hard-coded in `services/authentication.js` as `frontent-is-also-backend`. It is not read from the environment.

### Logout

`GET /user/logout` clears the `sessionToken` cookie and redirects to `/`.

## 7. Data Model

All schemas use Mongoose timestamps, so `createdAt` and `updatedAt` are generated automatically.

### User (`models/user.js`)

Fields:

- `fullName`: required string.
- `email`: required, unique string.
- `salt`: required string used for password hashing.
- `password`: required string containing the password hash after save.
- `profileImageURL`: string, defaulting to `/images/default.png`.
- `role`: either `USER` or `ADMIN`; defaults to `USER`.

A user can be referenced by blog posts through `Blog.createdBy` and by comments through `Comment.createdBy`.

### Blog (`models/blog.js`)

Fields:

- `title`: required string.
- `body`: required string. It is stored as submitted and converted from Markdown to HTML when a blog detail page is rendered.
- `coverImageURL`: optional string containing the public URL of the uploaded cover image.
- `createdBy`: ObjectId reference to the `user` model.

### Comment (`models/comment.js`)

Fields:

- `content`: required string.
- `blogId`: ObjectId reference to the `blog` model.
- `createdBy`: ObjectId reference to the `user` model.

Comments are loaded for a blog and populated with their author documents.

## 8. Route Map

### Application routes

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/` | Load all blogs and render `home.ejs`. |

### User routes (`routes/user.js`)

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/user/signup` | Render the signup form. |
| `POST` | `/user/signup` | Create a user and redirect to `/`. |
| `GET` | `/user/signin` | Render the signin form; optionally show a 401 warning. |
| `POST` | `/user/signin` | Validate credentials, set JWT cookie, and redirect to `/`. |
| `GET` | `/user/logout` | Clear the JWT cookie and redirect to `/`. |

### Blog routes (`routes/blog.js`)

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/blog/create-new` | Render the blog creation form. |
| `POST` | `/blog` | Accept a multipart form, save the image and blog document, then redirect to the blog detail page. |
| `GET` | `/blog/:blogId` | Load a blog and its comments, render Markdown, and render `blog.ejs`. |
| `POST` | `/blog/:blogId/comment` | Create a comment for the blog using the current user's ID, then redirect back to the blog. |

## 9. Blog Creation and Upload Handling

The new-blog form submits to `POST /blog` using `multipart/form-data` with these fields:

- `coverImage`: uploaded image file.
- `title`: blog title.
- `body`: blog body, intended to contain Markdown.

Multer uses disk storage. For each upload it:

1. Builds `public/uploads/<authenticated-user-id>` as the destination.
2. Creates that directory recursively when it does not exist.
3. Names the file `<timestamp>-<original-filename>`.
4. Exposes the saved file using a URL like `/uploads/<user-id>/<filename>`.

The created blog stores the generated public URL and the authenticated user's ID, then redirects to `/blog/<blog-id>`.

## 10. Request and Rendering Flows

### Anonymous homepage request

1. Browser requests `GET /`.
2. Cookie parser reads available cookies.
3. Authentication middleware leaves `req.user` unset when no session cookie exists.
4. The home handler queries all blog documents.
5. `home.ejs` renders the blog cards and passes `user` and `blogs`.
6. `navbar.ejs` shows guest links for signup and signin.

### Authenticated homepage request

The same flow occurs, except a valid `sessionToken` is decoded and placed in `req.user`. The navbar then shows the user's name, the Add Blog link, and a Logout link.

### Blog detail request

1. Browser requests `GET /blog/:blogId`.
2. The route finds the blog and populates its `createdBy` user.
3. The route finds comments for the blog and populates each comment's `createdBy` user.
4. `marked` converts the stored Markdown body to HTML.
5. `blog.ejs` renders the title, cover image, HTML body, author, timestamp, comments, and optional comment form.
6. The body is inserted with EJS's unescaped tag (`<%- ... %>`) because it is expected to contain rendered HTML.

### Comment request

1. An authenticated user submits the comment form from `blog.ejs`.
2. `POST /blog/:blogId/comment` reads `content` from `req.body`.
3. The route uses `req.user._id` as the comment author and the URL parameter as `blogId`.
4. The comment is saved and the browser is redirected to the same blog detail page.

## 11. Views and Shared UI

- `home.ejs` displays all blogs in Bootstrap cards with cover images, titles, and links to detail pages.
- `signup.ejs` provides full name, email, and password fields.
- `signin.ejs` provides email and password fields and can show an invalid-login alert.
- `addBlog.ejs` provides a multipart form for cover image, title, and Markdown body.
- `blog.ejs` displays the blog and its populated author, and shows the comment form only when `user` exists.
- `partials/navbar.ejs` is shared by all pages and changes its links based on `locals.user`.
- `partials/head.ejs` loads Bootstrap CSS and responsive metadata.
- `partials/script.ejs` loads the Bootstrap JavaScript bundle.

## 12. Current Access-Control Behavior and Limitations

The current UI hides authenticated-only links for guests, but the server does not enforce those restrictions with a dedicated middleware. In particular:

- `GET /blog/create-new` does not explicitly reject anonymous users.
- `POST /blog` assumes `req.user` exists while building the upload directory and blog document.
- `POST /blog/:blogId/comment` assumes `req.user` exists.
- A missing or malformed upload can cause `req.file` to be undefined when the blog is created.
- Invalid JWT verification errors are not caught, so a malformed or expired token can result in an uncaught request error.
- Blog and comment lookup failures are not handled explicitly. A missing blog can lead to a rendering error when `blog.body` is accessed.
- There is no validation or normalization layer for form input beyond the Mongoose required fields and the browser's HTML form attributes.
- Uploaded files are not restricted by server-side type, size, or extension validation.
- The JWT signing secret is hard-coded and has no expiration configured.
- The login cookie does not currently specify security options such as `httpOnly`, `secure`, `sameSite`, or an explicit expiration.
- The blog body is rendered as HTML after Markdown conversion and inserted unescaped. This is appropriate only if the Markdown pipeline is trusted or sanitized.
- There are no automated tests, API documentation, centralized error responses, pagination, editing, deletion, or administration workflows in the current codebase.

These are descriptions of the current implementation, not claims that the behavior is production-ready.

## 13. Local Development

Install dependencies:

```bash
npm install
```

Create a local `.env` file with at least a valid MongoDB connection string:

```env
MONGO_URL=<your-mongodb-connection-string>
PORT=8000
```

Run with automatic restart during development:

```bash
npm run dev
```

Run normally:

```bash
npm start
```

Once MongoDB connects successfully, the application listens on the configured port, or on `http://localhost:8000` by default.

## 14. Architectural Summary

The project follows a lightweight layered structure:

- `app.js` owns application startup, global middleware, and the homepage.
- `routes/` maps URLs to handlers and contains the blog-specific persistence logic.
- `controllers/` contains the user authentication operations.
- `services/` isolates JWT creation and verification.
- `middlewares/` attaches optional authentication state to requests.
- `models/` defines MongoDB document structure and user password behavior.
- `views/` contains server-rendered EJS pages and shared Bootstrap partials.
- `public/` contains browser-served static assets and uploaded files.

The main request lifecycle is:

```text
Browser request
  -> Express parsers and cookie parser
  -> static-file handling
  -> optional JWT user attachment
  -> application/router handler
  -> Mongoose query or mutation
  -> EJS rendering or redirect
  -> HTML response / browser request for static assets
```

Overall, the current application is a server-rendered CRUD foundation for blogs with basic user authentication and comments. Its next hardening priorities would be explicit authentication middleware, input and upload validation, JWT/cookie configuration through environment variables, error handling, and sanitization of rendered Markdown.
