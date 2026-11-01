const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'database.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server running on port 3000')
    })
  } catch (error) {
    console.log(`Database error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1: Get all books
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
    SELECT *
    FROM book;
  `
  const books = await db.all(getBooksQuery)
  response.send(books)
})

// API 2: Add a book
app.post('/books/', async (request, response) => {
  const {title, author, price, pages} = request.body

  const addBookQuery = `
    INSERT INTO book (title, author, price, pages)
    VALUES (?, ?, ?, ?);
  `

  await db.run(addBookQuery, [title, author, price, pages])
  response.send('Book Added Successfully')
})

// API 3: Get a particular book
app.get('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params

  const getBookQuery = `
    SELECT *
    FROM book
    WHERE id = ?;
  `

  const book = await db.get(getBookQuery, [bookId])
  response.send(book)
})

// API 4: Update a book
app.put('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params
  const {title, author, price, pages} = request.body

  const updateBookQuery = `
    UPDATE book
    SET title = ?,
        author = ?,
        price = ?,
        pages = ?
    WHERE id = ?;
  `

  await db.run(updateBookQuery, [title, author, price, pages, bookId])
  response.send('Book Details Updated')
})

// API 5: Delete a book
app.delete('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params

  const deleteBookQuery = `
    DELETE FROM book
    WHERE id = ?;
  `

  await db.run(deleteBookQuery, [bookId])
  response.send('Book Removed')
})

module.exports = app
