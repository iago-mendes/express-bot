import {ErrorRequestHandler} from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) =>
{
	return res.status(500).json({message: 'Internal server error', error: err})
}

export default errorHandler