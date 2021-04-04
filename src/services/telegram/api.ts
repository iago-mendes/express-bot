// HTTP requests setup for communication with the Telegram Bot API
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()
const token = process.env.TELEGRAM_TOKEN

const api = axios.create(
	{
		baseURL: `https://api.telegram.org/bot${token}/`,
	})

export default api