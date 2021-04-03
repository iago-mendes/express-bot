import UserInfo from '../models/UserInfo'

const usersInfo =
{
	getName: async (id: number) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
			return undefined
		else
			return userInfo.name
	},

	setName: async (id: number, name: string) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
		{
			const user =
			{
				id,
				name
			}

			await UserInfo.create(user)
		}
		else
			await UserInfo.findByIdAndUpdate(userInfo._id, {name})
	}
}

export default usersInfo