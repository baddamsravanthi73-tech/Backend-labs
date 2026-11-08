const express = require('express')
const initializeDB = require('./database')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000
let db = null

/**
 * Connect to SQLite database and start the Express server
 */
const startServer = async () => {
  try {
    db = await initializeDB()
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`)
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

startServer()

// ============================================================================
// ROOT ROUTE: Welcome & API Guide
// ============================================================================
app.get('/', (request, response) => {
  response.status(200).send('Welcome to BDF Lab 3 REST API! Visit /books to explore books.')
})

// ============================================================================
// API 1: GET /books - Search, filter, sort & pagination via query params
// ============================================================================
app.get('/books', async (request, response) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price = 0,
      max_price = 1000000,
    } = request.query

    // Validate numeric pagination parameters
    const parsedLimit = Number(limit)
    const parsedOffset = Number(offset)
    if (isNaN(parsedLimit) || parsedLimit < 0 || isNaN(parsedOffset) || parsedOffset < 0) {
      return response.status(400).json({ error: 'Limit and offset must be non-negative numbers' })
    }

    // Validate numeric price filters
    const parsedMinPrice = Number(min_price)
    const parsedMaxPrice = Number(max_price)
    if (isNaN(parsedMinPrice) || parsedMinPrice < 0 || isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
      return response.status(400).json({ error: 'Price filters must be valid positive numbers' })
    }

    // Ensure min_price does not exceed max_price
    if (parsedMinPrice > parsedMaxPrice) {
      return response.status(400).json({ error: 'Minimum price cannot exceed maximum price' })
    }

    // Whitelist valid columns to prevent SQL injection in ORDER BY
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages']
    const safeOrderBy = allowedColumns.includes(order_by) ? order_by : 'id'
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    const getBooksQuery = `
      SELECT *
      FROM book
      WHERE title LIKE ?
        AND price >= ?
        AND price <= ?
      ORDER BY ${safeOrderBy} ${safeOrder}
      LIMIT ? OFFSET ?;
    `

    const books = await db.all(getBooksQuery, [
      `%${search_q}%`,
      parsedMinPrice,
      parsedMaxPrice,
      parsedLimit,
      parsedOffset,
    ])

    response.status(200).json(books)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// ============================================================================
// API 2: GET /books/:bookId - Get a single book by ID
// ============================================================================
app.get('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params

    if (isNaN(bookId) || Number(bookId) <= 0) {
      return response.status(400).json({ error: 'Invalid Book ID' })
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `

    const book = await db.get(getBookQuery, [bookId])

    if (book === undefined) {
      return response.status(404).json({ error: 'Book Not Found' })
    }

    response.status(200).json(book)
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// ============================================================================
// API 3: POST /books - Add a new book with input validation
// ============================================================================
app.post('/books', async (request, response) => {
  try {
    const { title, author, price, pages } = request.body

    // Reject missing or empty title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing title' })
    }

    // Reject missing or empty author
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing author' })
    }

    // Reject non-numeric or invalid price
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return response.status(400).json({ error: 'Price must be a valid positive number' })
    }

    // Reject non-numeric or invalid pages
    if (pages === undefined || pages === null || isNaN(Number(pages)) || Number(pages) <= 0) {
      return response.status(400).json({ error: 'Pages must be a valid positive number' })
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `

    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
    ])

    response.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID,
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// ============================================================================
// API 4: PUT /books/:bookId - Update an existing book with validation
// ============================================================================
app.put('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const { title, author, price, pages } = request.body

    if (isNaN(bookId) || Number(bookId) <= 0) {
      return response.status(400).json({ error: 'Invalid Book ID' })
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing title' })
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).json({ error: 'Invalid or missing author' })
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return response.status(400).json({ error: 'Price must be a valid positive number' })
    }
    if (pages === undefined || pages === null || isNaN(Number(pages)) || Number(pages) <= 0) {
      return response.status(400).json({ error: 'Pages must be a valid positive number' })
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?,
          author = ?,
          price = ?,
          pages = ?
      WHERE id = ?;
    `

    const result = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      bookId,
    ])

    if (result.changes === 0) {
      return response.status(404).json({ error: 'Book Not Found' })
    }

    response.status(200).json({ message: 'Book Details Updated' })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// ============================================================================
// API 5: DELETE /books/:bookId - Delete a book by ID
// ============================================================================
app.delete('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params

    if (isNaN(bookId) || Number(bookId) <= 0) {
      return response.status(400).json({ error: 'Invalid Book ID' })
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `

    const result = await db.run(deleteBookQuery, [bookId])

    if (result.changes === 0) {
      return response.status(404).json({ error: 'Book Not Found' })
    }

    response.status(200).json({ message: 'Book Removed' })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

// ============================================================================
// CATCH-ALL: 404 Route Not Found
// ============================================================================
app.use((request, response) => {
  response.status(404).json({ error: 'Route Not Found' })
})

module.exports = app

