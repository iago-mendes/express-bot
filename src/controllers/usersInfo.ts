import UserInfo from '../models/UserInfo'

const usersInfo =
{
	saveUser: async (id: number, name: string) =>
	{
		const user =
		{
			id,
			name
		}

		await UserInfo.create(user)
	},

	getName: async (id: number) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
			return undefined
		else
			return userInfo.name
	}
}

export default usersInfo