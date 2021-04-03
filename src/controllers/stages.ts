import Update, { User } from '../models/Update'
import apiVtex from '../services/vtex/api'
import formatPrice from '../utils/formatPrice'
import bot from './bot'
import users from './users'
import usersInfo from './usersInfo'

const stages =
{
	welcome: async (text: string, update: Update, user: User) =>
	{
		await users.start(update)
		let name = await usersInfo.getName(user.id)
		
		if (!name)
		{
			await usersInfo.setName(user.id, 'tmp')
			return await bot.sendMessage(update,
				'Olá, meu nome é Thaís e estou aqui para te ajudar a fazer compras.' +
				'\nAntes de começarmos qual o seu nome?'
			)
		}
		else
		{
			if (name === 'tmp')
			{
				await usersInfo.setName(user.id, text)
				name = text
			}

			await users.nextStage(user)

			await bot.sendMessage(update,
				`Que bom te ver por aqui, ${name}!` +
				'\n\nAlgumas orientações para nos ajudar nesta compra:' +
				'\n- Conversaremos só por mensagens;' +
				'\n- Digite o nome do produto que você deseja comprar;' +
				'\n- Clique em "selecionar" para adicionar seu produto no carrinho;' +
				'\n- Não se esqueça de conferir nossas promoções diárias.'
			)
	
			await bot.sendMessage(update,
				'Então vamos lá!' +
				'\nDiga-me o nome do produto que você quer pesquisar.'
			)
		}
	},

	selectProducts: async (text: string, update: Update, user: User) =>
	{
		const isUserSelectingQuantity = await users.isUserSelectingQuantity(user)

		if (!isUserSelectingQuantity.answer)
		{
			if (text === '/finalizar')
			{
				users.nextStage(user)

				await bot.sendMessage(update,
					'Pedido finalizado com sucesso!' +
					'\n Agora, vamos cuidar das informações financeiras...'
				)

				const cart = await users.getCart(user)
				bot.sendPayment(update, cart)
			}
			else if (['/selecionar', '/editar'].includes(text.split('_')[0]))
			{
				const productId = Number(text.split('_')[1])
				const product = apiVtex.getProduct(productId)

				if (!product)
				{
					bot.sendMessage(update,
						'Produto não encontrado!' +
						'\nTente pesquisar novamente por um produto.'
					)
				}
				else
				{
					await users.toggleIsUserSelectingQuantity(user, productId)

					bot.sendMessage(update,
						`Qual a quantidade que você deseja comprar de ${product.name}?` +
						'\nOBS.: Digite somente números maiores que 0',
						[[{
							label: 'Cancelar',
							command: '/cancelar'
						}]]
					)
				}
			}
			else if (['/remover'].includes(text.split('_')[0]))
			{
				const productId = Number(text.split('_')[1])
				await users.removeProduct(user, productId)

				const cartDisplay = await users.getCartDisplay(user)
				await bot.sendMessage(update, cartDisplay)

				await bot.sendMessage(update,
					'Produto removido com sucesso!' +
					'\nDiga-me o nome de mais um produto que você deseja pesquisar.',
					[[{
						label: 'Finalizar',
						command: '/finalizar'
					}]]
				)
			}
			else
			{
				const search = text.trim()
				const products = apiVtex.searchProducts(search)

				if (products.length === 0)
					return bot.sendMessage(update, 
						'Eu não encontrei produtos com base na sua pesquisa. 😞' +
						'\n\n Que tal pesquisar por outro produto?',
						[[{
							label: 'Finalizar',
							command: '/finalizar'
						}]]
					)

				const productsDisplay = products.map((product) => (
					`\n\n➡️ <b>${product.name} (${product.brand})</b>` +
					`\n${product.description}` +
					`\n${formatPrice(product.price)}` +
					`\n<code>Selecionar:</code> /selecionar_${product.id}`
				)).join('')

				await bot.sendMessage(update, 
					'Eu encontrei os seguintes produtos:' +
					productsDisplay
				)

				bot.sendMessage(update,
					'Se você quiser pesquisar por outro produto, basta digitar que eu cuido disso para você.',
					[[{
						label: 'Finalizar',
						command: '/finalizar'
					}]]
				)
			}
		}
		else
		{
			const product = isUserSelectingQuantity.product
			if (!product)
				return

			if (text === '/cancelar')
			{
				await users.toggleIsUserSelectingQuantity(user)

				return bot.sendMessage(update,
					'Pronto... Já cancelei!' +
					'\nSe você quiser pesquisar por outro produto, basta digitar que eu cuido disso para você.',
					[[{
						label: 'Finalizar',
						command: '/finalizar'
					}]]
				)
			}

			const quantity = Number(text)

			if (isNaN(quantity) || quantity < 1)
				return bot.sendMessage(update,
					'Você me mandou uma quantidade inválida! Vamos tentar novamente...' +
					`\n\nQual a quantidade que você deseja comprar de ${product.name}?` +
					'\nOBS.: Digite somente números maiores que 0',
					[[{
						label: 'Cancelar',
						command: '/cancelar'
					}]]
				)

			await users.addProduct(user, product, quantity)
			await users.toggleIsUserSelectingQuantity(user)
			
			const cartDisplay = await users.getCartDisplay(user)
			await bot.sendMessage(update, cartDisplay)

			return bot.sendMessage(update,
				'Produto adicionado com sucesso!' +
				'\nDiga-me o nome de mais um produto que você deseja pesquisar.',
				[[{
					label: 'Finalizar',
					command: '/finalizar'
				}]]
			)
		}
	},

	checkout: async (update: Update, user: User) =>
	{
		users.remove(user)

		bot.sendMessage(update,
			'Pedido confirmado com sucesso!' +
			'\n\n🤗 Obrigado por comprar conosco! Volte sempre!!!'
		)
	}
}

export default stages