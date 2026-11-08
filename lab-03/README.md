# Lab 3: REST API, Query Parameters, Validation and Debugging

## Student Details

- **Student Name:** Chaithanya Reddy
- **Registration Number:** 252U1R5015
- **Course:** Backend Development Fundamentals
- **Academic Term:** Year II – Term II
- **University:** Aurora Deemed University
- **Faculty:** Joel Prashanth D

---

## Deployment Status

- **Status:** Local Development Verified
- **Deployment URL:** *(Deployment Pending — Live verification conducted locally on http://localhost:3000)*
- **Platform Target:** Render / Railway (Persistent Volume configuration required for SQLite database)

---

## Objective

To build on the foundations of Lab 2 by developing an advanced yet beginner-friendly RESTful API using Node.js, Express.js, and SQLite.

The project demonstrates:
1. Modular project architecture separating database connection logic (`database.js`) from route handlers (`server.js`).
2. Comprehensive query parameter processing (`search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price`).
3. Search functionality using SQL `LIKE` with wildcards (`%`).
4. Column allowlisting and dynamic sorting with `ORDER BY ... ASC/DESC` while preventing SQL injection.
5. Robust pagination with SQL `LIMIT` and `OFFSET`.
6. Numerical range filtering for prices.
7. Request payload validation for `POST` and `PUT` operations with descriptive `400 Bad Request` error responses.
8. Accurate HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
9. Systematic backend debugging methodologies for common runtime errors (`EADDRINUSE`, `MODULE_NOT_FOUND`, table typos, missing `await`).

---

## Technologies Used

- **Node.js** (v26.x) — Server-side JavaScript runtime
- **Express.js** (v4.21.2) — Fast, unopinionated minimalist web framework
- **SQLite3** (`sqlite3`) — Embedded, self-contained relational database engine
- **SQLite Wrapper** (`sqlite`) — Promise-based wrapper enabling `async/await` syntax
- **Postman / cURL** — API development and endpoint verification
- **VS Code** — Source code editor

---

## Project Structure

```text
lab-03/
├── server.js                        # Express server, route definitions, and validation logic
├── database.js                      # Modular SQLite database connection handler
├── database.db                      # Persistent SQLite database file containing the book table
├── package.json                     # Project dependencies, scripts, and student metadata
├── .gitignore                       # Excludes node_modules/, .env, and OS artifacts
├── README.md                        # Complete project documentation and Postman testing guide
├── debugging/
│   └── debugging-exercises.md       # In-depth analysis of 4 backend debugging exercises
└── screenshots/                     # 25 execution and verification screenshots
    ├── 01-get-all-books.png
    ├── 02-search-books.png
    ├── 03-sort-ascending.png
    ├── 04-sort-descending.png
    ├── 05-pagination.png
    ├── 06-pagination-next-page.png
    ├── 07-min-price-filter.png
    ├── 08-max-price-filter.png
    ├── 09-price-range.png
    ├── 10-combined-query.png
    ├── 11-get-book-by-id.png
    ├── 12-book-not-found.png
    ├── 13-add-book.png
    ├── 14-missing-title.png
    ├── 15-missing-author.png
    ├── 16-invalid-price.png
    ├── 17-update-book.png
    ├── 18-update-invalid-id.png
    ├── 19-delete-book.png
    ├── 20-delete-invalid-id.png
    ├── 21-sqlite-database.png
    ├── 22-port-conflict.png
    ├── 23-import-error.png
    ├── 24-table-error.png
    └── 25-missing-await.png
```

---

## Database Schema & Seed Data

The database file `database.db` contains the persistent `book` table with the following schema:

```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);
```

### Pre-Seeded 10 Sample Books

| ID | Title | Author | Price ($) | Pages |
|:---|:---|:---|:---|:---|
| 1 | The Pragmatic Programmer | Andrew Hunt & David Thomas | 45 | 352 |
| 2 | Clean Code | Robert C. Martin | 40 | 464 |
| 3 | JavaScript: The Good Parts | Douglas Crockford | 30 | 176 |
| 4 | Design Patterns | Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides | 55 | 395 |
| 5 | Introduction to Algorithms | Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein | 85 | 1312 |
| 6 | You Don't Know JS Yet | Kyle Simpson | 25 | 142 |
| 7 | Designing Data-Intensive Applications | Martin Kleppmann | 50 | 616 |
| 8 | Refactoring: Improving the Design of Existing Code | Martin Fowler | 48 | 448 |
| 9 | Node.js Design Patterns | Mario Casciaro & Luciano Mammino | 42 | 520 |
| 10 | Eloquent JavaScript | Marijn Haverbeke | 35 | 472 |

---

## Installation & How to Run

### 1. Installation
Open a terminal inside `lab-03/` and install dependencies:
```bash
npm install
```

### 2. Run Server
Start the Express server:
```bash
npm start
```
For development with auto-reload (using Nodemon):
```bash
npm run dev
```

**Expected terminal output:**
```text
Server Running at http://localhost:3000/
```

---

## API Endpoints Summary

| Method | Path | Description | Query / Body Params | Status Codes |
|:---|:---|:---|:---|:---|
| **GET** | `/` | API Welcome message & guide | None | `200 OK` |
| **GET** | `/books` | Search, sort, filter & paginate books | `search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price` | `200 OK`, `400 Bad Request`, `500 Internal Server Error` |
| **GET** | `/books/:bookId` | Retrieve single book by ID | URL parameter: `bookId` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **POST** | `/books` | Create a new book record | JSON: `title`, `author`, `price`, `pages` | `201 Created`, `400 Bad Request` |
| **PUT** | `/books/:bookId` | Update an existing book | URL param: `bookId`; JSON body | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/books/:bookId` | Delete a book by ID | URL parameter: `bookId` | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## Query Parameters Guide (`GET /books`)

The `GET /books` endpoint accepts flexible query parameters with sensible defaults:

1. **`search_q`** (String, default: `""`): Matches partial book titles using case-insensitive SQL `LIKE '%search_q%'`.
2. **`order_by`** (String, default: `"id"`): Column to sort by. Allowed values: `id`, `title`, `author`, `price`, `pages`. Any invalid column safely falls back to `"id"`.
3. **`order`** (String, default: `"ASC"`): Sort order direction. Allowed values: `ASC` or `DESC`.
4. **`limit`** (Number, default: `10`): Maximum number of records to return per page.
5. **`offset`** (Number, default: `0`): Number of records to skip for pagination.
6. **`min_price`** (Number, default: `0`): Minimum price filter (`price >= min_price`).
7. **`max_price`** (Number, default: `1000000`): Maximum price filter (`price <= max_price`).

### Security Note on SQL Injection Prevention:
Because SQL column identifiers and `ASC`/`DESC` keywords cannot be parameterized via `?` in SQLite, we enforce an explicit column allowlist:
```javascript
const allowedColumns = ['id', 'title', 'author', 'price', 'pages']
const safeOrderBy = allowedColumns.includes(order_by) ? order_by : 'id'
const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
```
All user data (`search_q`, `min_price`, `max_price`, `limit`, `offset`) is safely bound using `?` placeholders.

---

## Step-by-Step Postman Testing Guide

Base URL: `http://localhost:3000`

### GET Requests (1 – 12)

#### 1. Get All Books
- **Method:** `GET`
- **URL:** `http://localhost:3000/books`
- **Expected Status:** `200 OK`
- **Expected Response:** JSON array of all 10 books.

#### 2. Search Books by Title
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?search_q=JavaScript`
- **Expected Status:** `200 OK`
- **Expected Response:** 2 books returned: *"JavaScript: The Good Parts"* (ID 3) and *"Eloquent JavaScript"* (ID 10).

#### 3. Sort Ascending by Price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=ASC`
- **Expected Status:** `200 OK`
- **Expected Response:** Books ordered from lowest ($25: *You Don't Know JS Yet*) to highest ($85: *Introduction to Algorithms*).

#### 4. Sort Descending by Price
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?order_by=price&order=DESC`
- **Expected Status:** `200 OK`
- **Expected Response:** Books ordered from highest ($85) to lowest ($25).

#### 5. Pagination (First Page)
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?limit=5&offset=0`
- **Expected Status:** `200 OK`
- **Expected Response:** First 5 books (IDs 1 through 5).

#### 6. Pagination (Second Page)
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?limit=5&offset=5`
- **Expected Status:** `200 OK`
- **Expected Response:** Next 5 books (IDs 6 through 10).

#### 7. Minimum Price Filter
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?min_price=50`
- **Expected Status:** `200 OK`
- **Expected Response:** 3 books with price >= 50 (*Design Patterns* $55, *Algorithms* $85, *Designing Data-Intensive Apps* $50).

#### 8. Maximum Price Filter
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?max_price=40`
- **Expected Status:** `200 OK`
- **Expected Response:** 4 books with price <= 40 (*Clean Code* $40, *JS: The Good Parts* $30, *You Don't Know JS Yet* $25, *Eloquent JS* $35).

#### 9. Price Range Filter
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?min_price=40&max_price=50`
- **Expected Status:** `200 OK`
- **Expected Response:** 5 books priced between $40 and $50.

#### 10. Combined Query Parameters
- **Method:** `GET`
- **URL:** `http://localhost:3000/books?search_q=JavaScript&order_by=price&order=ASC&limit=5&offset=0&min_price=25&max_price=50`
- **Expected Status:** `200 OK`
- **Expected Response:** 2 books matching title 'JavaScript', priced between $25-$50, sorted by price ascending.

#### 11. Get Individual Book by ID
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/1`
- **Expected Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "id": 1,
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt & David Thomas",
    "price": 45,
    "pages": 352
  }
  ```

#### 12. Non-Existent Book ID (404)
- **Method:** `GET`
- **URL:** `http://localhost:3000/books/999`
- **Expected Status:** `404 Not Found`
- **Expected Response:**
  ```json
  {
    "error": "Book Not Found"
  }
  ```

---

### POST Requests (13 – 16)

#### 13. Add a New Book
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Python Programming",
    "author": "John",
    "price": 60,
    "pages": 350
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "message": "Book Added Successfully",
    "bookId": 11
  }
  ```

#### 14. Missing Title Validation
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Body:** `{"author": "John", "price": 60, "pages": 350}`
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"error": "Invalid or missing title"}`

#### 15. Missing Author Validation
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Body:** `{"title": "Python Programming", "price": 60, "pages": 350}`
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"error": "Invalid or missing author"}`

#### 16. Invalid Price Validation
- **Method:** `POST`
- **URL:** `http://localhost:3000/books`
- **Body:** `{"title": "Python Programming", "author": "John", "price": "not-a-number", "pages": 350}`
- **Expected Status:** `400 Bad Request`
- **Expected Response:** `{"error": "Price must be a valid positive number"}`

---

### PUT Requests (17 – 18)

#### 17. Update Existing Book
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/1`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "The Pragmatic Programmer: 20th Anniversary",
    "author": "Andrew Hunt & David Thomas",
    "price": 50,
    "pages": 360
  }
  ```
- **Expected Status:** `200 OK`
- **Expected Response:** `{"message": "Book Details Updated"}`

#### 18. Update Non-Existent Book ID
- **Method:** `PUT`
- **URL:** `http://localhost:3000/books/999`
- **Body:** Same JSON as #17
- **Expected Status:** `404 Not Found`
- **Expected Response:** `{"error": "Book Not Found"}`

---

### DELETE Requests (19 – 20)

#### 19. Delete a Book
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/11`
- **Expected Status:** `200 OK`
- **Expected Response:** `{"message": "Book Removed"}`

#### 20. Delete Non-Existent Book ID
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/books/999`
- **Expected Status:** `404 Not Found`
- **Expected Response:** `{"error": "Book Not Found"}`

---

## HTTP Status Codes Reference

- **`200 OK`**: Standard successful response for GET, PUT, and DELETE operations.
- **`201 Created`**: Returned upon successful creation of a new book resource via POST.
- **`400 Bad Request`**: Returned when client sends invalid parameters, non-numeric IDs, negative limits/offsets, or malformed body fields.
- **`404 Not Found`**: Returned when querying, updating, or deleting a resource ID that does not exist in the database, or an invalid route.
- **`500 Internal Server Error`**: Caught by `try/catch` wrappers to gracefully report unexpected database errors without crashing the server process.

---

## Actual Execution Screenshots

All 25 screenshots document live API tests and debugging scenarios executed on `http://localhost:3000`:

### API 1: Query Parameters (Screenshots 1 – 10)

#### 1. GET All Books (`/books`)
![Get All Books](screenshots/01-get-all-books.png)

#### 2. Search Books by Title (`?search_q=JavaScript`)
![Search Books](screenshots/02-search-books.png)

#### 3. Sort Ascending (`?order_by=price&order=ASC`)
![Sort Ascending](screenshots/03-sort-ascending.png)

#### 4. Sort Descending (`?order_by=price&order=DESC`)
![Sort Descending](screenshots/04-sort-descending.png)

#### 5. Pagination Page 1 (`?limit=5&offset=0`)
![Pagination Page 1](screenshots/05-pagination.png)

#### 6. Pagination Page 2 (`?limit=5&offset=5`)
![Pagination Page 2](screenshots/06-pagination-next-page.png)

#### 7. Minimum Price Filter (`?min_price=50`)
![Min Price Filter](screenshots/07-min-price-filter.png)

#### 8. Maximum Price Filter (`?max_price=40`)
![Max Price Filter](screenshots/08-max-price-filter.png)

#### 9. Price Range Filter (`?min_price=40&max_price=50`)
![Price Range](screenshots/09-price-range.png)

#### 10. Combined Query Parameters
![Combined Query](screenshots/10-combined-query.png)

---

### API 2: Single Book Retrieval (Screenshots 11 – 12)

#### 11. Get Individual Book by ID (`GET /books/1`)
![Get Book By ID](screenshots/11-get-book-by-id.png)

#### 12. Non-Existent Book ID (`GET /books/999` — 404)
![Book Not Found](screenshots/12-book-not-found.png)

---

### API 3: Create Book & Validation (Screenshots 13 – 16)

#### 13. Add Book Successfully (`POST /books` — 201)
![Add Book](screenshots/13-add-book.png)

#### 14. Missing Title Validation (400 Bad Request)
![Missing Title](screenshots/14-missing-title.png)

#### 15. Missing Author Validation (400 Bad Request)
![Missing Author](screenshots/15-missing-author.png)

#### 16. Invalid Price Validation (400 Bad Request)
![Invalid Price](screenshots/16-invalid-price.png)

---

### API 4 & 5: Update and Delete (Screenshots 17 – 20)

#### 17. Update Book Successfully (`PUT /books/1` — 200)
![Update Book](screenshots/17-update-book.png)

#### 18. Update Non-Existent Book ID (404 Not Found)
![Update Invalid ID](screenshots/18-update-invalid-id.png)

#### 19. Delete Book Successfully (`DELETE /books/11` — 200)
![Delete Book](screenshots/19-delete-book.png)

#### 20. Delete Non-Existent Book ID (404 Not Found)
![Delete Invalid ID](screenshots/20-delete-invalid-id.png)

---

### Database & Debugging Scenarios (Screenshots 21 – 25)

#### 21. SQLite Database CLI & Schema Verification
![SQLite Database](screenshots/21-sqlite-database.png)

#### 22. Debugging Exercise 1: Port Conflict (`EADDRINUSE`)
![Port Conflict](screenshots/22-port-conflict.png)

#### 23. Debugging Exercise 2: Import Error (`MODULE_NOT_FOUND`)
![Import Error](screenshots/23-import-error.png)

#### 24. Debugging Exercise 3: SQL Table Name Typo
![Table Error](screenshots/24-table-error.png)

#### 25. Debugging Exercise 4: Missing `await` on Database Call
![Missing Await](screenshots/25-missing-await.png)

---

## Debugging Exercises Summary

Detailed analysis, reproducible code snippets, error traces, and explanations are documented in [debugging/debugging-exercises.md](debugging/debugging-exercises.md):

1. **`EADDRINUSE`:** Port 3000 collision resolved by detecting PIDs with `netstat -ano` and killing hung tasks with `taskkill /PID <PID> /F`.
2. **`MODULE_NOT_FOUND`:** CommonJS import errors resolved by standardizing relative file paths (`require('./database')`).
3. **`SQLITE_ERROR: no such table`:** Schema mismatch resolved by aligning SQL query identifiers to singular table name (`FROM book`).
4. **Missing `await`:** Fixed empty JSON serialization (`{}`) by ensuring all Promise-returning SQLite database calls are properly awaited.

---

## Problems Faced and Solutions

1. **SQL Injection Vulnerability in `ORDER BY` Clause:**
   - *Problem:* SQL placeholder `?` cannot be used for column names or `ASC`/`DESC` directions in parameterized queries. Directly interpolating user query strings (`${order_by}`) introduces critical SQL injection vulnerabilities.
   - *Solution:* Implemented an explicit allowlist array:
     ```javascript
     const allowedColumns = ['id', 'title', 'author', 'price', 'pages']
     const safeOrderBy = allowedColumns.includes(order_by) ? order_by : 'id'
     const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
     ```

2. **Negative Limits & Inverted Price Range Queries:**
   - *Problem:* Users passing negative pagination values (`limit=-5`) or inverted price ranges (`min_price=100&max_price=20`) cause unexpected SQLite errors or empty results.
   - *Solution:* Validated all numeric query parameters before executing SQL. When `parsedMinPrice > parsedMaxPrice`, the server returns a helpful `400 Bad Request` with `{"error": "Minimum price cannot exceed maximum price"}`.

3. **Database Race Condition on Server Startup:**
   - *Problem:* Calling `app.listen()` before `open()` resolves causes early HTTP requests to access `db = null`, throwing unhandled runtime exceptions.
   - *Solution:* Encapsulated server startup inside `startServer()` using `await initializeDB()`. The HTTP listener only starts once the database connection is confirmed open.

---

## Conclusion

Lab 3 demonstrates the construction of a robust, production-pattern REST API using Node.js, Express, and SQLite. By incorporating rigorous request validation, parameterized queries with allowlists, comprehensive error handling, and clean modular code architecture, the application fulfills all academic and practical requirements.
