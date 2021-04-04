import Product from '../models/Product'
import Update, {ShippingQuery, PreCheckoutQuery} from '../models/Update'
import api from '../services//telegram/api'
import apiVtex from '../services/vtex/api'
import formatPrice from '../utils/formatPrice'
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
			return await stages.checkout('/payed', update, user)
		
		const text = update.callback_query
			? update.callback_query.data
			: update.message.text.trim()
		
		if (['/sp'].includes(text.split('_')[0]))
			return bot.updateSearchPaginated(update, text)
		
		const hasMessageBeenProcessed = await users.hasMessageBeenProcessed(user, messageId)
		if (hasMessageBeenProcessed)
			return
		else
			await users.addProcessedMessage(user, messageId)
		
		api.post('sendChatAction',
			{
				chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
				action: 'typing'
			})

		const userStage = await users.getStage(user)

		if (userStage === 0)
			await stages.welcome(text, update, user)
		else if (userStage === 1)
			await stages.selectProducts(text, update, user)
		else if (userStage === 2)
			await stages.checkout(text, update, user)
	},

	sendMessage: async (
		update: Update,
		message: string,
		buttons?: Array<Array<{label: string, command: string, url?: string}>>
	) =>
	{
		const callbackButtons = buttons
			? buttons.map(row => (
				row.map(({label, command, url}) =>
				{
					if (url)
						return {
							text: label,
							url
						}
					else
						return {
							text: label,
							callback_data: command
						}
				}))
			)
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
				console.error('[error when sending message]', error.response.data)
			})
	},

	sendImage: async (
		update: Update,
		url: string,
		caption: string,
		buttons?: Array<Array<{text: string, callback_data: string}>>
	) =>
	{
		const params =
		{
			chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
			photo: url,
			caption,
			parse_mode: 'HTML',
			reply_markup:
			{
				inline_keyboard: buttons
			}
		}
		
		await api.post('sendPhoto', params)
			.catch(error =>
			{
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
				`, ${quantity}x ${product.name}`
			)
		}).join('')

		const description =
			`${totalQuantity} produtos no total` +
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
				photo_url: 'https://aexpress.iago-mendes.me/public/avon.png',
				need_shipping_address: true,
				is_flexible: true,
				reply_markup:
				{
					inline_keyboard:
					[
						[{text: `Pagar ${formatPrice(totalPrice)}`, pay: true}],
						[{text: 'Cancelar pedido', callback_data: '/cancelar'}]
					]
				}
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
	},

	sendSearchPaginated: async (update: Update, header: string, list: string[], search: string) =>
	{
		const pages = Math.ceil(list.length / 3)

		const filteredList = pages > 1
			? list.slice(0, 3)
			: list

		const message =
			header +
			filteredList.join('')

		const pagination: Array<Array<{text: string, callback_data: string}>> | undefined = pages > 1
			? [[
				{text: '* 1 *', callback_data: `/sp_1_1_${search}`},
				{text: '2 >', callback_data: `/sp_1_2_${search}`}
			]]
			: undefined
		
		await api.post('sendMessage',
			{
				chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
				text: message,
				parse_mode: 'HTML',
				reply_markup:
				{
					inline_keyboard: pagination
				}
			})
			.catch(error =>
			{
				console.error('[error when sending message]', error.response.data)
			})
	},

	updateSearchPaginated: async (update: Update, data: string) =>
	{
		let [, previousPageString, newPageString, search] = data.split('_')
		const previousPage = Number(previousPageString)
		const newPage = Number(newPageString)

		if (previousPage === newPage)
			return

		const products = apiVtex.searchProducts(search)
		const list = products.map((product) => (
			`\n\n➡️ <b>${product.name}</b>` +
			`\n${formatPrice(product.price)}` +
			`\n${truncateText(product.description, 100)}` +
			`\n<code>Selecionar:</code> /selecionar_${product.id}` +
			`\n<code>Ver imagem:</code> /imagem_${product.id}`
		))

		const pages = Math.ceil(list.length / 3)

		const startIndex = 3*Number(newPage-1)
		const filteredList = startIndex + 3 < list.length-1
			? list.slice(startIndex, startIndex + 3)
			: list.slice(startIndex)

		const message =
			`Mostrando ${list.length} resultados de produtos...` +
			filteredList.join('')

		let pagination: Array<Array<{text: string, callback_data: string}>> | undefined = pages > 1
			? [[]]
			: undefined
		
		if (pagination)
		{
			if (newPage === 1)
			{
				pagination[0].push({text: '* 1 *', callback_data: `/sp_1_1_${search}`})
				pagination[0].push({text: '2 >', callback_data: `/sp_1_2_${search}`})
			}
			else if (newPage === pages)
			{
				pagination[0].push({text: `< ${newPage-1}`, callback_data: `/sp_${newPage}_${newPage-1}_${search}`})
				pagination[0].push({text: `* ${newPage} *`, callback_data: `/sp_${newPage}_${newPage}_${search}`})
			}
			else
			{
				pagination[0].push({text: `< ${newPage-1}`, callback_data: `/sp_${newPage}_${newPage-1}_${search}`})
				pagination[0].push({text: `* ${newPage} *`, callback_data: `/sp_${newPage}_${newPage}_${search}`})
				pagination[0].push({text: `${newPage+1} >`, callback_data: `/sp_${newPage}_${newPage+1}_${search}`})
			}
		}

		await api.post('editMessageText',
			{
				chat_id: update.callback_query ? update.callback_query.message.chat.id : update.message.chat.id,
				message_id: update.callback_query ? update.callback_query.message.message_id : update.message.message_id,
				text: message,
				parse_mode: 'HTML',
				reply_markup:
				{
					inline_keyboard: pagination
				}
			})
			.catch(error =>
			{
				console.error('[error when sending message]', error.response.data)
			})
	}
}

export default bot