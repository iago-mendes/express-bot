import express from 'express'

const routes = express.Router()

routes.get('/', (req, res) => res.json({message: 'Welcome! This is the Express Bot solution for Avon.'}))

export default routes