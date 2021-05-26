// main file that starts the application
import express from 'express'
import cors from 'cors'
import 'express-async-errors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'

import errorHandler from './errors/handler'
import bot from './controllers/bot'
import routes from './routes'

const app = express()
dotenv.config()

app.use(cors())
app.use(express.json())

mongoose.connect(
	String(process.env.MONGODB_URI),
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	}
)
mongoose.connection
	.once('open', () => console.log('database connected'))
	.on('error', error => console.log('[database connection error]:', error))

bot.setWebhook()
app.use(routes)
app.use('/public', express.static(path.join(__dirname, '..', 'public')))

app.use(errorHandler)

const port = process.env.PORT || 6262
app.listen(port, () => console.log('server started at port', port))