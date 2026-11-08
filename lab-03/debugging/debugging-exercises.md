# Lab 3: Backend Debugging Exercises

**Student Name:** Chaithanya Reddy  
**Registration Number:** 252U1R5015  
**Course:** Backend Development Fundamentals  
**Faculty:** Joel Prashanth D  
**University:** Aurora Deemed University  

---

## Overview

In backend development with Node.js, Express, and SQLite, developers routinely encounter runtime exceptions, network port conflicts, and asynchronous execution pitfalls. This document details four foundational debugging scenarios, complete with reproducible error messages, incorrect implementations, corrected code, and conceptual explanations.

---

## Exercise 1: Port Conflict (`EADDRINUSE`)

### 1. Problem
When starting an Express application with `app.listen(3000)`, Node attempts to bind to TCP port `3000`. If another process (such as another running server instance, a previous background daemon, or another web server) is already listening on port `3000`, the operating system refuses the socket binding.

### 2. Incorrect Code / Situation
Running two server instances concurrently on the same port:
```javascript
// Server Instance 1 is already active on port 3000
const app = express()
app.listen(3000, () => console.log('Server 1 running on port 3000'))

// Server Instance 2 attempts to bind to the same port
const app2 = express()
app2.listen(3000, () => console.log('Server 2 running on port 3000'))
```

### 3. Error Message
```text
node:events:497
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1940:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

### 4. Corrected Code & Resolution
**Step A: Free the port in Windows PowerShell / Command Prompt:**
```powershell
# Identify the Process ID (PID) occupying port 3000
netstat -ano | findstr :3000

# Terminate the blocking process using its PID (e.g., PID 12344)
taskkill /PID 12344 /F
```

**Step B: Make the port configurable in code:**
```javascript
// Allow dynamic port configuration via environment variable
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}/`)
})
```

### 5. Explanation
TCP ports must be unique per network interface for a given protocol. Using `process.env.PORT || 3000` allows the server to gracefully bind to an alternative port (e.g., `PORT=3001 node server.js`) without modifying source code, while terminating lingering background Node tasks releases the blocked socket.

---

## Exercise 2: Wrong Import Path (`MODULE_NOT_FOUND`)

### 1. Problem
Node.js CommonJS `require()` searches for local files relative to the current file's directory when using `./` or `../`. Typos in filenames, missing relative indicators (`./`), or incorrect directory depth cause the Node module resolution algorithm to fail immediately at startup.

### 2. Incorrect Code
Attempting to import the database connection helper with a wrong filename or omitting relative directory path:
```javascript
// Incorrect: Typo in filename or wrong relative path
const initializeDB = require('./db-connection') // File does not exist
// OR
const initializeDB = require('database') // Node looks in node_modules instead of local directory
```

### 3. Error Message
```text
node:internal/modules/cjs/loader:1225
  throw err;
  ^

Error: Cannot find module './db-connection'
Require stack:
- C:\Users\Chaithanya Reddy\Downloads\Backend-Labs-main\Backend-Labs-main\lab-03\server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1222:15)
    at Module._load (node:internal/modules/cjs/loader:1048:27)
    at Module.require (node:internal/modules/cjs/loader:1308:19)
    at require (node:internal/modules/helpers:136:18)
    at Object.<anonymous> (C:\Users\Chaithanya Reddy\...\server.js:2:22) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\Chaithanya Reddy\\Downloads\\Backend-Labs-main\\Backend-Labs-main\\lab-03\\server.js'
  ]
}
```

### 4. Corrected Code
```javascript
// Correct: Exact relative path to database.js in the same directory
const initializeDB = require('./database')
```

### 5. Explanation
When `require()` is passed a path beginning with `./` or `../`, Node resolves the path relative to the executing file. Omitting `./` causes Node to search inside `node_modules/` or core Node modules. Ensuring the file basename matches (`./database` resolves to `./database.js`) allows Node's CommonJS loader to find and evaluate the module.

---

## Exercise 3: SQLite Table-Name Typo (`SQLITE_ERROR: no such table`)

### 1. Problem
SQL table identifiers are validated strictly by the SQLite query compiler at execution time. Referencing a pluralized table name (e.g., `books` instead of `book`) or misspelling table names triggers an immediate runtime database error.

### 2. Incorrect Code
```javascript
app.get('/books', async (request, response) => {
  try {
    // Incorrect: Using plural 'books' instead of table 'book'
    const getBooksQuery = `SELECT * FROM books;`
    const books = await db.all(getBooksQuery)
    response.json(books)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})
```

### 3. Error Message
```text
SQLITE_ERROR: no such table: books
    at async C:\Users\Chaithanya Reddy\...\server.js:45:19
Emitted HTTP Response:
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8

{
  "error": "SQLITE_ERROR: no such table: books"
}
```

### 4. Corrected Code
```javascript
app.get('/books', async (request, response) => {
  try {
    // Correct: Exact table name defined in database.db schema is 'book'
    const getBooksQuery = `SELECT * FROM book;`
    const books = await db.all(getBooksQuery)
    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})
```

### 5. Explanation
In SQLite, table names must exactly match the schema defined during `CREATE TABLE book (...)`. While JavaScript developers often think in plurals for collections (`/books`), database tables are frequently named in the singular (`book`). Running `.schema` in the SQLite CLI or checking schema definition files confirms the exact table identifier.

---

## Exercise 4: Missing `await` on Asynchronous Database Calls

### 1. Problem
All `sqlite` database wrapper methods (`db.all()`, `db.get()`, `db.run()`, `open()`) return JavaScript `Promise` objects. Omitting the `await` keyword causes the function execution to proceed synchronously before the database driver returns the queried records. As a result, the Promise object itself is serialized to JSON (`{}`), or subsequent code encounters race conditions.

### 2. Incorrect Code
```javascript
app.get('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`

    // Incorrect: Missing 'await' keyword
    const book = db.get(getBookQuery, [bookId])

    // 'book' is Promise { <pending> }, not the actual record object!
    if (book === undefined) {
      response.status(404).json({ error: 'Book Not Found' })
    } else {
      // Sends empty object {} because Promise instances serialize to {} in JSON
      response.status(200).json(book)
    }
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})
```

### 3. Error / Unexpected Behavior
- The client receives an empty JSON response `200 OK` with `{}` instead of the book record:
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json; charset=utf-8

  {}
  ```
- If the book does not exist in the database, `book` is STILL not `undefined` (it is an unfulfilled Promise object), so the 404 block is bypassed completely!

### 4. Corrected Code
```javascript
app.get('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`

    // Correct: 'await' pauses execution until SQLite returns the row
    const book = await db.get(getBookQuery, [bookId])

    if (book === undefined) {
      return response.status(404).json({ error: 'Book Not Found' })
    }

    response.status(200).json(book)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})
```

### 5. Explanation
Database disk I/O is asynchronous and non-blocking in Node.js. The `await` keyword yields execution back to Node's event loop until the SQLite driver fulfills the Promise with the resolved database row. Without `await`, JavaScript evaluates the truthiness of the unresolved Promise instance (`Boolean(Promise) === true`), failing conditionals and sending empty JSON payloads.

