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
  try {
    const getBooksQuery = `
      SELECT *
      FROM book;
    `
    const books = await db.all(getBooksQuery)
    response.status(200).send(books)
  } catch (error) {
    response.status(500).send({error: error.message})
  }
})

// API 2: Add a book
app.post('/books/', async (request, response) => {
  try {
    const {title, author, price, pages} = request.body

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `

    await db.run(addBookQuery, [title, author, price, pages])
    response.status(201).send('Book Added Successfully')
  } catch (error) {
    response.status(500).send({error: error.message})
  }
})

// API 3: Get a particular book
app.get('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params

    if (isNaN(bookId)) {
      return response.status(400).json({error: 'Invalid book ID'})
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `

    const book = await db.get(getBookQuery, [bookId])
    if (!book) {
      return response.status(404).json({error: 'Book not found'})
    }

    response.status(200).send(book)
  } catch (error) {
    response.status(500).send({error: error.message})
  }
})

// API 4: Update a book
app.put('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params

    if (isNaN(bookId)) {
      return response.status(400).json({error: 'Invalid book ID'})
    }

    const {title, author, price, pages} = request.body

    const updateBookQuery = `
      UPDATE book
      SET title = ?,
          author = ?,
          price = ?,
          pages = ?
      WHERE id = ?;
    `

    const result = await db.run(updateBookQuery, [title, author, price, pages, bookId])
    if (result.changes === 0) {
      return response.status(404).json({error: 'Book not found'})
    }

    response.status(200).send('Book Details Updated')
  } catch (error) {
    response.status(500).send({error: error.message})
  }
})

// API 5: Delete a book
app.delete('/books/:bookId/', async (request, response) => {
  try {
    const {bookId} = request.params

    if (isNaN(bookId)) {
      return response.status(400).json({error: 'Invalid book ID'})
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `

    const result = await db.run(deleteBookQuery, [bookId])
    if (result.changes === 0) {
      return response.status(404).json({error: 'Book not found'})
    }

    response.status(200).send('Book Removed')
  } catch (error) {
    response.status(500).send({error: error.message})
  }
})

module.exports = app
