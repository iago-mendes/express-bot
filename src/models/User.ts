import mongoose from 'mongoose'

import Product from './Product'

export type UserType = mongoose.Document & 
{
	id: number
	processedMessages: number[]
	stage: number
	startedAt: string // Date
	products: Product[]
}

const UserSchema = new mongoose.Schema(
	{
		id: {type: Number, required: true},
		processedMessages: [{type: Number, required: true}],
		stage: {type: Number, required: true},
		startedAt: {type: Date, default: Date.now(), expires: 24 * 3600},
		products:
		[{
			id: {type: Number, required: true},
			name: {type: String, required: true},
			brand: {type: String, required: true},
			description: {type: String, required: true},
			keywords: {type: String, required: true},
			price: {type: Number, required: true}
		}]
	})

export default mongoose.model<UserType>('User', UserSchema)