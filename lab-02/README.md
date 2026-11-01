# Lab 2: SQLite database and CRUD routes

## Student Details

- **Student Name:** B. Chaitanya Reddy
- **Registration Number:** 252U1R5015
- **Section:** CSE AIDE (2A)
- **Course:** Backend Development Fundamentals
- **Academic Term:** Year II – Term II
- **Faculty:** Joel Prashanth D

---

## Objective

To build a beginner-friendly Express.js server connected to a SQLite database (`database.db`) using the `sqlite` and `sqlite3` packages, establish the connection using `open()`, and implement the 5 standard RESTful CRUD routes using parameterized SQL queries with `?` placeholders.

---

## Technologies and Packages Used

- **Node.js** — JavaScript runtime environment
- **Express.js** (`express`) — Minimal web framework for routing
- **SQLite3** (`sqlite3`) — Embedded relational database driver
- **SQLite Wrapper** (`sqlite`) — Promise-based SQLite library supporting `async/await`
- **Nodemon** (`nodemon`) — Development server that automatically restarts on file changes

---

## Project Structure

```text
lab-02/
├── server.js            # Express server and 5 CRUD route handlers
├── database.db          # SQLite database containing the book table
├── seed.sql             # SQL schema and 10 sample records
├── package.json         # Project metadata and start script
├── package-lock.json    # Dependency lockfile
├── .gitignore           # Excludes node_modules/ and .env
├── README.md            # Lab documentation and Postman guide
└── screenshots/         # Endpoint outputs and SQLite CLI verification
    ├── 01-get-all-books.png
    ├── 02-get-single-book.png
    ├── 03-get-book-404.png
    ├── 04-invalid-id-400.png
    ├── 05-post-create-book.png
    ├── 06-put-update-book.png
    ├── 07-delete-book.png
    └── 08-sqlite-cli-verification.png
```

---

## Database Schema: `book`

The SQLite database file is `database.db`.

```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique ID for each book |
| `title` | TEXT | | Book title |
| `author` | TEXT | | Author name |
| `price` | INTEGER | | Book price |
| `pages` | INTEGER | | Page count |

The database contains 10 valid sample books. The server startup function connects to the persistent database file and does not duplicate records when restarting.

---

## Installation & Running the Server

### 1. Install Dependencies
Open a terminal inside the `lab-02/` directory and run:
```bash
npm install
```

### 2. Start the Server (with Nodemon)
```bash
npm start
```
Starts `nodemon server.js`. The server runs on port 3000:
```text
Server running on port 3000
```

---

## Five CRUD Endpoints Summary

| Method | Path | Description | Expected Status |
|---|---|---|---|
| **GET** | `/books/` | Retrieve all books | `200 OK` |
| **GET** | `/books/:bookId/` | Retrieve a single book by ID | `200 OK` / `404 Not Found` |
| **POST** | `/books/` | Add a new book | `201 Created` |
| **PUT** | `/books/:bookId/` | Update an existing book | `200 OK` / `404 Not Found` |
| **DELETE** | `/books/:bookId/` | Delete a book | `200 OK` / `404 Not Found` |

---

## Step-by-Step Postman Testing Guide

Open Postman, create a new request collection, and test each endpoint:

### 1. GET All Books
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/`
- **Expected Status:** `200 OK`
- **Response:** JSON array of all books from the database.

### 2. GET Single Book by ID
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/1/`
- **Expected Status:** `200 OK`
- **Response:**
  ```json
  {
    "id": 1,
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt & David Thomas",
    "price": 45,
    "pages": 352
  }
  ```
- **Error Testing (Non-Existent Book):**
  - **URL:** `http://localhost:3000/books/999/`
  - **Expected Status:** `404 Not Found`
  - **Response:** `Book Not Found`

### 3. POST Add a New Book
- **Method:** `POST`
- **URL:** `http://localhost:3000/books/`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 45,
    "pages": 432
  }
  ```
- **Expected Status:** `201 Created`
- **Response:** `Book Added Successfully`

### 4. PUT Update a Book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1/`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "title": "The Pragmatic Programmer: 20th Anniversary Edition",
    "author": "Andrew Hunt & David Thomas",
    "price": 50,
    "pages": 360
  }
  ```
- **Expected Status:** `200 OK`
- **Response:** `Book Details Updated`
- **Error Testing (Non-Existent Book):**
  - **URL:** `http://localhost:3000/books/999/`
  - **Expected Status:** `404 Not Found`
  - **Response:** `Book Not Found`

### 5. DELETE a Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/10/`
- **Expected Status:** `200 OK`
- **Response:** `Book Removed`
- **Error Testing (Non-Existent Book):**
  - **URL:** `http://localhost:3000/books/999/`
  - **Expected Status:** `404 Not Found`
  - **Response:** `Book Not Found`
- **Verification:** Sending `GET http://localhost:3000/books/10/` now returns `404 Not Found` with `Book Not Found`.

---

## Parameterized SQL Queries & Security

Every SQL query uses `?` placeholders to safely bind user parameters:

```javascript
// Parameterized GET query
const getBookQuery = `
  SELECT * FROM book
  WHERE id = ?;
`
const bookDetails = await db.get(getBookQuery, bookId)

// Parameterized INSERT query
const addBookQuery = `
  INSERT INTO book (title, author, price, pages)
  VALUES (?, ?, ?, ?);
`
await db.run(addBookQuery, title, author, price, pages)
```

- **Security Advantage:** User input is never concatenated directly into SQL queries. The database driver treats input strictly as data literals, preventing **SQL Injection (SQLi)** vulnerabilities.

---

## Screenshots

The working outputs and database verification are documented in `screenshots/`:

### 1. GET All Books (`GET /books/`)
![Get All Books](screenshots/01-get-all-books.png)

### 2. GET Single Book (`GET /books/1/`)
![Get Single Book](screenshots/02-get-single-book.png)

### 3. Non-Existent Book (`GET /books/999/` — 404 Not Found)
![Book Not Found](screenshots/03-get-book-404.png)

### 4. Invalid ID Verification
![Invalid ID](screenshots/04-invalid-id-400.png)

### 5. Add a Book (`POST /books/` — 201 Created)
![Add Book](screenshots/05-post-create-book.png)

### 6. Update a Book (`PUT /books/:bookId/` — 200 OK)
![Update Book](screenshots/06-put-update-book.png)

### 7. Delete a Book (`DELETE /books/:bookId/` — 200 OK)
![Delete Book](screenshots/07-delete-book.png)

### 8. SQLite CLI Verification (`.schema` and Sample Records)
![SQLite CLI Verification](screenshots/08-sqlite-cli-verification.png)

---

## Problems Faced and Solutions

1. **Database Initialization Order:**
   - *Problem:* Initiating server listeners before SQLite finishes connecting leads to `null` database instance errors.
   - *Solution:* Used `async/await` with `open()` inside `initializeDBAndServer()` so `app.listen(3000)` only triggers once the database connection is successfully established.

2. **Detecting Non-Existent Records on Update and Delete:**
   - *Problem:* SQLite `UPDATE` and `DELETE` statements do not automatically throw errors when an ID does not exist in the table.
   - *Solution:* Inspected `result.changes`. If `result.changes === 0`, the endpoint returns a `404 Not Found` response with `Book Not Found`.

3. **Preventing Duplicate Sample Data:**
   - *Problem:* Running SQL `INSERT` commands within server code repeatedly creates duplicate rows whenever Nodemon reloads.
   - *Solution:* Pre-seeded the database once using `seed.sql` into persistent `database.db`. The server interacts strictly with existing records.

4. **Preventing SQL Injection:**
   - *Problem:* Dynamic string template literals in SQL queries leave the application vulnerable to injection attacks.
   - *Solution:* Parameterized all input variables (`title`, `author`, `price`, `pages`, `bookId`) via `?` place-markers passed to `db.run()` and `db.get()`.

---

## Deployment Status and Explanation

- **Status:** Not Deployed to Cloud Hosting.
- **Explanation:** Free cloud hosting tiers (like Render or Vercel) use **ephemeral filesystems**. Any changes written to a local `database.db` file are erased when the container sleeps or restarts. Deploying SQLite in cloud production requires persistent block storage volumes (e.g. Render Persistent Disks). All five CRUD routes are verified locally.
