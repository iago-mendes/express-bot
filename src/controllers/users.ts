import Update, {User as UserInterface} from '../models/Update'
import User from '../models/User'
import Product from '../models/Product'
import formatPrice from '../utils/formatPrice'
import apiVtex from '../services/vtex/api'

const users =
{
	start: async (update: Update) =>
	{
		const user =
		{
			id: update.message.from.id,
			processedMessages: [update.message.message_id],
			stage: 1,
			isSelectingQuantity: false,
			products: []
		}

		await User.create(user)
	},

	getStage: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return 0

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

	addProduct: async (user: UserInterface, newProduct: Product, quantity: number) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return
		
		let cart = savedUser.cart

		const existingIndex = cart.findIndex(item => item.product.id === newProduct.id)
		if (existingIndex >= 0)
			cart[existingIndex].quantity = quantity
		else
			cart.push(
				{
					quantity,
					product: newProduct
				})

		await User.findByIdAndUpdate(savedUser._id, {cart})
	},

	getCart: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return []
		
		const cart = savedUser.cart
		return cart
	},

	getCartDisplay: async (user: UserInterface, showEdit = true, showRemove = true) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return ''
		
		const cart = savedUser.cart
		let totalPrice = 0

		const productsDisplay = cart.map(({quantity, product}) =>
		{
			totalPrice += quantity * product.price

			return (
				`\n\n➡️ ${product.name} (${product.brand})` +
				`\n${product.description}` +
				`\n${quantity}x ${formatPrice(product.price)}` +
				`${showEdit ? '\n<code>Editar</code>: /editar_'+ product.id : ''}` +
				`${showRemove ? '\n<code>Remover</code>: /remover_'+ product.id : ''}`
			)
		}).join('')

		const cartDisplay =
		'<b>Carrinho de produtos</b>' +
		`\nPreço total: ${formatPrice(totalPrice)}` +
		productsDisplay

		return cartDisplay
	},

	removeProduct: async (user: UserInterface, productId: number) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return
		
		const products = savedUser.cart.filter(item => item.product.id !== productId)

		await User.findByIdAndUpdate(savedUser._id, {products})
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
	},

	isUserSelectingQuantity: async (user: UserInterface) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return {answer: false}
		
		const product = apiVtex.getProduct(Number(savedUser.selectingProductId))
		
		return {answer: savedUser.isSelectingQuantity, product}
	},

	toggleIsUserSelectingQuantity: async (user: UserInterface, productId?: number) =>
	{
		const savedUser = await User.findOne({id: user.id})
		if (!savedUser)
			return
		
		const selectingProductId = productId
			? productId
			: savedUser.selectingProductId

		const isSelectingQuantity = !savedUser.isSelectingQuantity
		await User.findByIdAndUpdate(savedUser._id, {isSelectingQuantity, selectingProductId})
	}
}

export default users