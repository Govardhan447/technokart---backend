const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dbPath = path.join(__dirname, 'blogPosts.db')
const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(-1)
  }
}
initializeDBAndServer()

//Get Books API
app.get('/books/', (request, response) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getBooksQuery = `
            SELECT
              *
            FROM
             book
            ORDER BY
             book_id;`
        const booksArray = await db.all(getBooksQuery)
        response.send(booksArray)
      }
    })
  }
})

//Get Book API
app.get('/posts/:postId/', async (request, response) => {
  const {postId} = request.params
  const getBookQuery = `
      SELECT
       *
      FROM
       blog_posts 
      WHERE
       post_id = ${postId};
    `
  const post = await db.get(getBookQuery)
  response.send(post)
})

//User Register API
app.post('/users/', async (request, response) => {
  const {id, username, password} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (id, username, password) 
      VALUES 
        (
          ${id}, 
          '${username}',
          '${hashedPassword}'
          )`
    await db.run(createUserQuery)
    response.send(`User created successfully`)
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//User Login API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

//Blog post API
app.post('/posts/', async (request, response) => {
  const {post_id, post} = request.body
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const createUserQuery = `
      INSERT INTO 
        blog_posts(post_id, post) 
      VALUES 
        (
          ${post_id}, 
          '${post}'
         )`
        const dbResponse = await db.run(createUserQuery)
        response.send('blog post created')
      }
    })
  }
})

// PUT API 4 Update todo
app.put('/posts/:postId/', async (request, response) => {
  const {postId} = request.params
  const requestBody = request.body
  const {description} = requestBody
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          UPDATE
            blog_posts
          SET
            post = '${description}',
           WHERE
            post_id = ${postId};`
        data = await db.run(getToDoQuery)

        response.send(data)
      }
    })
  }
})

//DELETE from Post table  API 5
app.delete('/posts/:postId/', async (request, response) => {
  const {postId} = request.params
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          DELETE FROM
            blog_posts
          WHERE
            post_id = ${postId};`
        const dbResponse = await db.run(getToDoQuery)
        response.send('Todo Deleted')
      }
    })
  }
})

//comment Insert API
app.post('/comments/', async (request, response) => {
  const {id, comment} = request.body
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const createUserQuery = `
      INSERT INTO 
        comment (comment_id, comment) 
      VALUES 
        (
          ${id}, 
          '${comment}'
         )`
        const dbResponse = await db.run(createUserQuery)
        response.send('blog comment created')
      }
    })
  }
})

//Get Book API
app.get('/comments/', async (request, response) => {
  const {postId} = request.params
  const getBookQuery = `
      SELECT
       *
      FROM
       comments 
     `
  const comment = await db.get(getBookQuery)
  response.send(comment)
})

// comment update API
app.put('/comments/:commentId/', async (request, response) => {
  const {commentId} = request.params
  const requestBody = request.body
  const {description} = requestBody
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          UPDATE
            comments
          SET
            comment = '${description}',
           WHERE
            comment_id = ${commentId};`
        data = await db.run(getToDoQuery)

        response.send(data)
      }
    })
  }
})

//DELETE todo table API 5
app.delete('/comments/:commentId/', async (request, response) => {
  const {commentId} = request.params
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          DELETE FROM
            comments
          WHERE
            comment_id = ${commentId};`
        const dbResponse = await db.run(getToDoQuery)
        response.send('Comment Deleted')
      }
    })
  }
})
