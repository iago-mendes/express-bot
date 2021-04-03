import Product from '../models/Product'
import Update, {ShippingQuery, PreCheckoutQuery} from '../models/Update'
import api from '../services//telegram/api'
import apiVtex from '../services/vtex/api'
import truncateText from '../utils/truncateText'
import stages from './stages'
import users from './users'

const bot =
{
	getUpdates: () =>
	{
		let offset: number | undefined = undefined

		setInterval(() =>
		{
			const data = offset
				? {offset}
				: {}

			api.post('getUpdates', data)
				.then(res =>
				{
					const update: Update = res.data.result[0]
					if (update)
					{
						offset = update.update_id + 1

						if (update.shipping_query)
							return bot.sendShippingInfo(update.shipping_query)
						if (update.pre_checkout_query)
							return bot.confirmCheckout(update.pre_checkout_query)

						api.post('sendChatAction',
							{
								chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
								action: 'typing'
							})
						
						bot.checkStage(update)
					}
				})
				.catch(error =>
				{
					if (!error.response)
						console.error('[error]', error)
					else if (error.response.data.error_code !== 409)
						console.error('[error]', error.response.data)
				})
		}, 3*1000)
	},

	checkStage: async (update: Update) =>
	{
		const user = update.callback_query ? update.callback_query.from : update.message.from
		const messageId = update.callback_query ? update.callback_query.message.message_id : update.message.message_id

		if (update.message && update.message.successful_payment)
			return await stages.checkout(update, user)
		
		const text = update.callback_query
			? update.callback_query.data
			: update.message.text.trim()
		
		const hasMessageBeenProcessed = await users.hasMessageBeenProcessed(user, messageId)
		if (hasMessageBeenProcessed)
			return
		else
			await users.addProcessedMessage(user, messageId)

		const userStage = await users.getStage(user)

		if (userStage === 0)
			await stages.welcome(text, update, user)
		else if (userStage === 1)
			await stages.selectProducts(text, update, user)
	},

	sendMessage: async (update: Update, message: string, buttons?: Array<Array<{label: string, command: string}>>) =>
	{
		const callbackButtons = buttons
			? buttons.map(row => (
				row.map(({label, command}) => (
					{
						text: label,
						callback_data: command
					}))
			))
			: undefined

		const params =
		{
			chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
			text: message,
			parse_mode: 'HTML',
			reply_markup:
			{
				inline_keyboard: callbackButtons
			}
		}
		await api.post('sendMessage', params)
			.catch(error =>
			{
				console.log('[callbackButtons]', callbackButtons)
				console.error('[error when sending message]', error.response.data)
			})
	},

	sendPayment: async (update: Update, cart: Array<{quantity: number, product: Product}>) =>
	{
		let totalQuantity = 0
		let totalPrice = 0

		const productsDisplay = cart.map(({quantity, product}) =>
		{
			totalQuantity += quantity
			totalPrice += quantity * product.price

			return (
				`\n${quantity}x ${product.name} (${product.brand})`
			)
		}).join('')

		const description =
		`Quantidade total: ${totalQuantity}` +
		'\n' +
		productsDisplay

		await api.post('sendInvoice',
			{
				chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
				title: 'Pedido na BlitzServe',
				description: truncateText(description, 255),
				payload: 'payload',
				provider_token: process.env.TELEGRAM_STRIPE_TOKEN,
				start_parameter: 'vCH1vGWJxfSeofSAs0K5PA',
				currency: 'BRL',
				prices:
				[{
					label: 'Valor em produtos',
					amount: Math.round(totalPrice * 100)
				}],
				photo_url: 'https://assets.blu365.com.br/uploads/sites/4/2019/01/revendedora-avon-cadastro.jpg',
				need_shipping_address: true,
				is_flexible: true
			})
			.catch(error => console.error('[error while sending payment]', error.response.data))
	},

	sendShippingInfo: async (shippingQuery: ShippingQuery) =>
	{
		const cep = shippingQuery.shipping_address.post_code
		const shippingOptions = await apiVtex.calcularFrete(cep)

		api.post('answerShippingQuery',
			{
				shipping_query_id: shippingQuery.id,
				ok: true,
				shipping_options: shippingOptions
			})
	},

	confirmCheckout: async (preCheckoutQuery: PreCheckoutQuery) =>
	{
		api.post('answerPreCheckoutQuery',
			{
				pre_checkout_query_id: preCheckoutQuery.id,
				ok: true
			})
	}
}

export default bot