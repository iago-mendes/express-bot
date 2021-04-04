import Product from '../models/Product'
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
				name,
				previousCart: []
			}

			await UserInfo.create(user)
		}
		else
			await UserInfo.findByIdAndUpdate(userInfo._id, {name})
	},

	getPreviousCart: async (id: number) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
			return []
		else
			return userInfo.previousCart
	},

	setPreviousCart: async (id: number, cart: Array<{quantity: number, product: Product}>) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
		{
			const user =
			{
				id,
				name: '',
				previousCart: cart
			}

			await UserInfo.create(user)
		}
		else
			await UserInfo.findByIdAndUpdate(userInfo._id, {previousCart: cart})
	},

	hasPreviousCart: async (id: number) =>
	{
		const userInfo = await UserInfo.findOne({id})

		if (!userInfo)
			return false
		else
			return userInfo.previousCart.length !== 0
	},
}

export default usersInfo