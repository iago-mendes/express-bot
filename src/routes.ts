import express from 'express'

import bot from './controllers/bot'

const routes = express.Router()

routes.get('/', (req, res) => res.json({message: 'Welcome! This is the Express Bot solution for Avon.'}))
routes.post(`/${process.env.TELEGRAM_TOKEN}`, bot.getUpdate)

export default routes