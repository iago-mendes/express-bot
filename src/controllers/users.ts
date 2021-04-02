import Update, {User as UserInterface} from '../models/Update'
import User, {Product} from '../models/User'

const users =
{
	start: async (update: Update) =>
	{
		const user =
		{
			id: update.message.from.id,
			processedMessages: [update.message.message_id],
			stage: 0,
			products: []
		}

		await User.create(user)
	},

	getStage: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return -1

		return savedUser.stage
	},

	nextStage: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (savedUser)
		{
			const stage = savedUser.stage + 1
			await User.findByIdAndUpdate(savedUser._id, {stage})
		}
	},

	addProducts: async (user: UserInterface, newProducts: Product[]) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return
		
		const existingProducts = savedUser.products
		const products = [...existingProducts, ...newProducts]

		await User.findByIdAndUpdate(savedUser._id, {products})
	},

	getProducts: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return []
		
		const products = savedUser.products
		return products
	},

	remove: async (user: UserInterface) =>
	{
		await User.findOneAndRemove({id: user.id})
	},

	addProcessedMessage: async (user: UserInterface, messageId: number) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return
		
		let processedMessages = savedUser.processedMessages
		processedMessages.push(messageId)
		await User.findByIdAndUpdate(savedUser._id, {processedMessages})
	},

	hasMessageBeenProcessed: async (user: UserInterface, messageId: number) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return false
		
		const processedMessages = savedUser.processedMessages
		return processedMessages.includes(messageId)
	}
}

export default users