import express from 'express'

import bot from './controllers/bot'

const routes = express.Router()

routes.post(`/${process.env.TELEGRAM_TOKEN}`, bot.getUpdate)

export default routes