import express from 'express'
import cors from 'cors'
import 'express-async-errors'
import dotenv from 'dotenv'

import routes from './routes'
import errorHandler from './errors/handler'

const app = express()
dotenv.config()

app.use(cors())
app.use(express.json())

app.use(routes)

app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => console.log('server started at port', port))