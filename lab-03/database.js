const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'database.db')

/**
 * Initializes and opens connection to the SQLite database.
 * Reuses the persistent database.db file containing the book table.
 */
const initializeDB = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
  return db
}

module.exports = initializeDB

