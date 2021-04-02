import express from 'express'
import cors from 'cors'
import 'express-async-errors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import routes from './routes'
import errorHandler from './errors/handler'

const app = express()
dotenv.config()

app.use(cors())
app.use(express.json())

mongoose.connect(
	`mongodb://localhost:27017/${process.env.DB_NAME}?authSource=admin`,
	{
		user: process.env.DB_USER,
		pass: process.env.DB_PWD,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	}
)
mongoose.connection
	.once('open', () => console.log('database connected'))
	.on('error', error => console.log('[database connection error]:', error))

app.use(routes)

app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => console.log('server started at port', port))