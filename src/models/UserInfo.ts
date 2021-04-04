import mongoose from 'mongoose'

import Product from './Product'

export type UserInfoType = mongoose.Document & 
{
	id: number
	name: string
	previousCart: Array<
	{
		quantity: number
		product: Product
	}>
}

const UserInfoSchema = new mongoose.Schema(
	{
		id: {type: Number, required: true},
		name: {type: String, required: true},
		previousCart:
		[{
			quantity: {type: Number, required: true},
			product:
			{
				id: {type: Number, required: true},
				name: {type: String, required: true},
				brand: {type: String, required: true},
				description: {type: String, required: true},
				keywords: {type: String, required: true},
				price: {type: Number, required: true}
			}
		}]
	})

export default mongoose.model<UserInfoType>('UserInfo', UserInfoSchema)