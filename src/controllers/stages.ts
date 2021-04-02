import Update, { User } from '../models/Update'
import api from '../services/telegram/api'
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

			const products = await users.getProducts(user)
			const productsDisplay = products.map(product => (
				`\n\n➡️ <b>${product.name}</b>` +
				`\n<code>Remover:</code> /remover_${product.id}`
			)).join('')

			bot.sendMessage(update,
				'Pedido finalizado com sucesso!' +
				'\nConfira os seus produtos:' +
				productsDisplay +
				'\n\n <code>Confirmar:</code> /confirmar'
			)
		}
		else if (text.split('_')[0] === '/selecionar')
		{
			const productId = Number(text.split('_')[1])
			// const product = getProduct(productId)
			const product = {id: productId, name: 'Fake product'}

			users.addProducts(user, [product])

			bot.sendMessage(update, 
				'Produto adicionado com sucesso!' +
				'\nDiga-me o nome de mais um produto que você deseja pesquisar.' +
				'\n\n<code>Finalizar:</code> /finalizar'
			)
		}
		else
		{
			// const search = text.trim()
			// const products = searchProducts(search)
			const products =
			[
				{
					id: 1,
					name: 'Shampoo hidratante',
					description: 'Shampoo hidratante da marca X',
					price: 'R$ 9,90'
				},
				{
					id: 2,
					name: 'Condicionador Ultra Reparação',
					description: 'Condicionador Ultra Reparação da marca X',
					price: 'R$ 9,90'
				}
			]

			const productsDisplay = products.map((product) => (
				`\n\n➡️ <b>${product.name}</b>` +
				`\n${product.description}` +
				`\n${product.price}` +
				`\n<code>Selecionar:</code> /selecionar_${product.id}`
			)).join('')

			bot.sendMessage(update, 
				'Eu encontrei os seguintes produtos:' +
				productsDisplay
			)
		}
	},

	reviewProducts: async (text: string, update: Update, user: User) =>
	{
		if (text === '/confirmar')
		{
			const products = await users.getProducts(user)
			const productsDisplay = products.map(product => (
				`\n➡️ <b>${product.name}</b>`
			)).join('')

			users.remove(user)

			bot.sendMessage(update,
				'Pedido confirmado com sucesso!' +
				'\n\nConfira os seus produtos confirmados:' +
				productsDisplay +
				'\n\n🤗 Obrigado por comprar conosco! Volte sempre!!!'
			)
		}
		else if (text.split('_')[0] === '/remover')
		{
			const productId = Number(text.split('_')[1])
			await users.removeProduct(user, productId)

			const products = await users.getProducts(user)
			const productsDisplay = products.map(product => (
				`\n\n➡️ <b>${product.name}</b>` +
				`\n<code>Remover:</code> /remover_${product.id}`
			)).join('')

			bot.sendMessage(update,
				'Produto removido com sucesso!' +
				'\nConfira os seus produtos após essa operação:' +
				productsDisplay +
				'\n\n <code>Confirmar:</code> /confirmar'
			)
		}
	}
}

export default stages