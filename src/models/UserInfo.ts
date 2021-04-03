import mongoose from 'mongoose'

export type UserInfoType = mongoose.Document & 
{
	id: number
	name: string
}

const UserInfoSchema = new mongoose.Schema(
	{
		id: {type: Number, required: true},
		name: {type: String, required: true},
	})

export default mongoose.model<UserInfoType>('UserInfo', UserInfoSchema)