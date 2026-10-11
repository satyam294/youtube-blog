# YouTube Blog Project Context

## 1. Current project stage

This repository is a working Express + MongoDB blog application called Blogify. The project has moved beyond a simple prototype and now includes:

- guest browsing of published blog posts
- user signup and signin
- cookie-based authenticated sessions
- profile setup and profile dashboard
- blog creation with uploaded cover images
- blog reading and comments
- public static assets and uploaded files served from the app

The codebase is currently in a functional MVP stage: the main user journey works end-to-end, but it is still a lightweight app without admin moderation, multi-user roles enforcement, or a full production hardening pass.

## 2. Technology stack

- Runtime: Node.js
- Web framework: Express 5
- Template engine: EJS
- Database: MongoDB via Mongoose
- Auth: JWT in a `sessionToken` cookie
- Password hashing: bcrypt with a legacy salt-based compatibility path
- File uploads: Multer with local disk storage
- Markdown rendering: `marked`
- HTML sanitization: `sanitize-html`
- UI: Bootstrap 5
- Env loader: dotenv
- Dev runner: nodemon

## 3. Runtime configuration

The app centralizes environment handling in `config/index.js`.

Required runtime values:

- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: secret used to sign and verify JWTs

Optional values:

- `PORT`: HTTP port. Defaults to `8000`.
- `JWT_EXPIRES_IN`: token expiration. Defaults to `7d`.
- `NODE_ENV`: runtime type; defaults to `development`.

Startup behavior:

1. `dotenv` loads the environment.
2. `mongoose.connect(config.MONGO_URL)` is attempted.
3. The app listens only after the DB connection succeeds.
4. EJS templates are configured from the `views` directory.
5. Global request middleware is registered before route handling.

## 4. Application bootstrap and middleware

`app.js` contains the application entrypoint and order of startup:

1. load environment variables
2. create Express app
3. connect to MongoDB
4. configure EJS views
5. parse JSON and form data
6. attach cookies to `req.cookies`
7. serve static assets from `public`
8. attach the current user to the request via `attachUserIfPresent('sessionToken')`
9. register the homepage, `/user`, and `/blog` routers
10. register a 404 handler and a global error handler

The middleware order is currently:

- `express.json()`
- `express.urlencoded({ extended: false })`
- `cookieParser()`
- `express.static(path.resolve('./public'))`
- `attachUserIfPresent('sessionToken')`

`attachUserIfPresent` validates the JWT if present and sets `req.user`; if the token is invalid or expired, it clears the cookie and continues.

## 5. Authentication and authorization flow

### User signup

`POST /user/signup` is handled by `controlUserCreation` in `controllers/user.js`.

Flow:

1. Reads `fullName`, `email`, and `password` from `req.body`.
2. Creates a `User` document.
3. Creates a JWT payload using the user identity and role.
4. Stores the JWT in the `sessionToken` cookie.
5. Redirects the user to `/user/profile/setup`.

### Signin

`POST /user/signin` validates the user and redirects either to the protected route or home.

Flow:

1. Finds a user by email.
2. Uses `user.matchPassword(password)` to validate credentials.
3. Creates a JWT and stores it in the cookie.
4. Redirects to a safe `returnTo` value when present; otherwise redirects to `/`.

The app rejects invalid credentials with a redirect to `/user/signin?status=401`.

### Protected routes

`requireAuth` enforces login checks in `middlewares/authentication.js`.

Routes using it include:

- `/user/profile`
- `/user/profile/setup`
- `/blog/create-new`
- `/blog/:blogId/comment`
- `POST /blog`

### Logout

`GET /user/logout` clears the `sessionToken` cookie and redirects to `/`.

## 6. Profile features

The current profile flow is more advanced than the earlier project version:

- a user can complete their profile after signup
- the user can edit a bio
- a user can upload a profile image
- the profile page shows a profile card and a list of their own blog posts
- `profileComplete` is stored on the user and controls the reminder banner

Profile-related routes:

- `GET /user/profile`
- `GET /user/profile/setup`
- `POST /user/profile/setup`

## 7. Data model

All schemas use Mongoose timestamps (`createdAt`, `updatedAt`).

### User (`models/user.js`)

Fields:

- `fullName`: required string
- `email`: required unique string
- `password`: required string; stored as bcrypt hash after save
- `salt`: optional legacy field for older password entries
- `profileImageURL`: default `/images/default.png`
- `bio`: default value `I read blogs.` with max length 300
- `profileComplete`: boolean default `false`
- `role`: `USER` or `ADMIN`; defaults to `USER`

The `matchPassword` method supports both modern bcrypt-based passwords and older legacy salted-hash records.

### Blog (`models/blog.js`)

Fields:

- `title`: required string
- `body`: required string
- `coverImageURL`: optional file URL
- `createdBy`: reference to `user`

### Comment (`models/comment.js`)

Fields:

- `content`: required string
- `blogId`: reference to `blog`
- `createdBy`: reference to `user`

## 8. Route map

### Public routes

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/` | Render the home page with all blog cards. |
| `GET` | `/user/signup` | Render signup page. |
| `POST` | `/user/signup` | Create a user and sign them in. |
| `GET` | `/user/signin` | Render sign-in page, optionally showing a 401 warning. |
| `POST` | `/user/signin` | Validate credentials and set auth cookie. |
| `GET` | `/user/logout` | Clear the cookie and redirect home. |
| `GET` | `/blog/:blogId` | Render a blog entry with author and comments. |

### Authenticated routes

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/user/profile` | Render the authenticated user's profile and their blogs. |
| `GET` | `/user/profile/setup` | Render the profile setup form. |
| `POST` | `/user/profile/setup` | Update bio and/or upload a profile image. |
| `GET` | `/blog/create-new` | Render the blog creation form. |
| `POST` | `/blog` | Create a blog with an uploaded cover image. |
| `POST` | `/blog/:blogId/comment` | Add a comment to a blog. |

## 9. Upload handling

The project stores user-uploaded files locally in `public/uploads/<userId>/`.

### Profile image uploads

`middlewares/uploadProfileImage.js`:

- creates the user-specific upload directory when needed
- accepts only JPEG, PNG, and WebP images
- rejects unsupported MIME types with a `415` error
- enforces a 5 MB max file size

### Blog cover uploads

`middlewares/uploadBlogCoverImage.js`:

- creates the same user-specific upload folder
- accepts JPEG, PNG, and WebP images
- rejects invalid types with a `415` error
- enforces a 3 MB max file size

The saved file URL is stored as `/uploads/<userId>/<filename>` and rendered directly by the templates.

## 10. Rendering and content flow

The blog detail page handles Markdown rendering and sanitization:

1. `controlBlogRetrieval` fetches the blog and populates the author.
2. It fetches comments and populates each comment author.
3. It converts a blog body from Markdown to HTML via `marked`.
4. It sanitizes the generated HTML using `sanitize-html`.
5. It renders the blog in `views/blog.ejs`.

The homepage renders blog cards from `Blog.find({})` and each card links to the detail page.

## 11. Project structure

```text
app.js
config/
  index.js
controllers/
  home.js
  user.js
  blog.js
middlewares/
  authentication.js
  uploadProfileImage.js
  uploadBlogCoverImage.js
  errorHandler.js
models/
  user.js
  blog.js
  comment.js
public/
  images/
  uploads/
routes/
  user.js
  blog.js
services/
  authentication.js
  AppError.js
  safeRoute.js
  sanitize.js
views/
  home.ejs
  signup.ejs
  signin.ejs
  addBlog.ejs
  blog.ejs
  profile.ejs
  profile-setup.ejs
  error.ejs
  partials/
    head.ejs
    navbar.ejs
    script.ejs
```

## 12. Current quality and limitations

This version is functional but still intentionally lightweight. Notable limitations include:

- no admin-only enforcement beyond the `role` field on the model
- no blog edit or delete workflow
- no pagination or search
- no automated tests
- no central API-validation layer beyond basic model requirements
- no extensive production-level logging or monitoring
- upload storage is local and user-scoped rather than cloud-backed
- some error handling is centralized, but not every edge case is fully normalized

The project is therefore best described as a working blog MVP rather than a hardened production app.

## 13. Local development

Install dependencies:

```bash
npm install
```

Create a `.env` file with at least:

```env
MONGO_URL=<your-mongodb-connection-string>
JWT_SECRET=<a-long-random-secret>
PORT=8000
```

Run the dev server:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

Once MongoDB is reachable and the JWT secret is set, the app listens on the configured port, usually `http://localhost:8000`.

## 14. Architectural summary

The project follows a simple layered architecture:

- `app.js` wires startup and global middleware
- `routes/` define HTTP entry points
- `controllers/` handle request logic and data flow
- `models/` define MongoDB schemas
- `middlewares/` handle auth and uploads
- `services/` contain JWT/auth helpers and sanitization utilities
- `views/` render EJS pages and shared UI partials
- `public/` serves static assets and uploaded user media

The main lifecycle is:

```text
Browser request
  -> Express parsers and cookie handling
  -> static asset lookup
  -> JWT user attachment
  -> route/controller logic
  -> Mongoose query or mutation
  -> EJS render or redirect
  -> HTTP response
```

Overall, the project is currently a working, server-rendered blog platform with authentication, profile completion, uploads, and comments, and it is at the stage of a feature-complete personal blog MVP.
