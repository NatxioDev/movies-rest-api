const express = require('express')

const movies = require('./movies.json')
const crypto = require('node:crypto')
const z = require('zod')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemes/movies')

const app = express()
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:3000'
      ]
      if (ACCEPTED_ORIGINS.includes(origin)) {
        callback(null, true)
      } else if (origin === undefined) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  })
)

app.disable('x-powered-by')
app.use(express.json())

// Todos los recursos que sean MOVIES se identidica con /movies
app.get('/movies', (req, res) => {
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(movie =>
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )

    return res.json(filteredMovies)
  }

  res.json(movies)
})

app.get('/movies/:id', (req, res) => {
  const id = req.params.id

  const movie = movies.find(movie => movie.id === id)

  if (movie) return res.json(movie)

  res.status(404).json({ error: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ error: 'Movie not found' })
  }

  const editedMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = editedMovie

  res.json(editedMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ error: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  res.status(204).end()
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} 🚀`)
})
