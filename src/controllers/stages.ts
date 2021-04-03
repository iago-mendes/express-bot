import Update, { User } from '../models/Update'
import api from '../services/telegram/api'
import apiVtex from '../services/vtex/api'
import formatPrice from '../utils/formatPrice'
import bot from './bot'
import users from './users'

const stages =
{
	welcome: async (update: Update) =>
	{
		await users.start(update)

		const params =
		{
			chat_id: update.message.chat.id,
			text:
			'🎉 Olá! Tudo bem? 🎉' +
			'\nEu sou um bot, e estou aqui para te ajudar a realizar seu pedido.' +
			'\n\nVamos lá... diga-me o nome de um produto que você deseja pesquisar.'
		}

		api.post('sendMessage', params)
	},

	selectProducts: async (text: string, update: Update, user: User) =>
	{
		if (text === '/finalizar')
		{
			users.nextStage(user)

			const cartDisplay = await users.getCartDisplay(user)
			await bot.sendMessage(update, cartDisplay)

			bot.sendMessage(update,
				'Pedido finalizado com sucesso!' +
				'\n\n <code>Confirmar:</code> /confirmar'
			)
		}
		else if (text.split('_')[0] === '/selecionar')
		{
			const productId = Number(text.split('_')[1])
			const product = apiVtex.getProduct(productId)

			if (product)
				await users.addProduct(user, product, 1)
			
			const cartDisplay = await users.getCartDisplay(user)
			await bot.sendMessage(update, cartDisplay)

			bot.sendMessage(update, 
				'Produto adicionado com sucesso!' +
				'\nDiga-me o nome de mais um produto que você deseja pesquisar.' +
				'\n\n<code>Finalizar:</code> /finalizar'
			)
		}
		else
		{
			const search = text.trim()
			const products = apiVtex.searchProducts(search)

			if (products.length === 0)
				bot.sendMessage(update, 
					'Eu não encontrei produtos com base na sua pesquisa. 😞' +
					'\n\n Que tal pesquisar por outro produto?'
				)

			const productsDisplay = products.map((product) => (
				`\n\n➡️ <b>${product.name} (${product.brand})</b>` +
				`\n${product.description}` +
				`\n${formatPrice(product.price)}` +
				`\n<code>Selecionar:</code> /selecionar_${product.id}`
			)).join('')

			bot.sendMessage(update, 
				'Eu encontrei os seguintes produtos:' +
				productsDisplay +
				'\n\nSe você quiser pesquisar por outro produto, basta digitar que eu cuido disso para você. '
			)
		}
	},

	reviewProducts: async (text: string, update: Update, user: User) =>
	{
		const cartDisplay = await users.getCartDisplay(user)
		await bot.sendMessage(update, cartDisplay)

		if (text === '/confirmar')
		{
			users.remove(user)

			bot.sendMessage(update,
				'Pedido confirmado com sucesso!' +
				'\n\n🤗 Obrigado por comprar conosco! Volte sempre!!!'
			)
		}
		else if (text.split('_')[0] === '/remover')
		{
			const productId = Number(text.split('_')[1])
			await users.removeProduct(user, productId)

			bot.sendMessage(update,
				'Produto removido com sucesso!' +
				'\n\n <code>Confirmar:</code> /confirmar'
			)
		}
	}
}

export default stages