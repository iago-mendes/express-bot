import Update, { User } from '../models/Update'
import apiVtex from '../services/vtex/api'
import formatPrice from '../utils/formatPrice'
import truncateText from '../utils/truncateText'
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
				'Olá 🙋🏻‍♀️, meu nome é Thaís e estou aqui para te ajudar a fazer compras. 🛒🛍️' +
				'\nAntes de começarmos qual o seu nome? 😁'
			)
		}
		else
		{
			if (name === 'tmp')
			{
				await usersInfo.setName(user.id, text)
				name = text
			}

			const hasPreviousCart = await usersInfo.hasPreviousCart(user.id)

			await users.nextStage(user)

			await bot.sendMessage(update,
				`Que bom te ver por aqui, ${name}!` +
				'\n\n⚠️ Algumas orientações para nos ajudar nesta compra:' +
				'\n- Conversaremos só por mensagens;' +
				'\n- Digite o nome do produto que você deseja comprar;' +
				'\n- Clique em "selecionar" para adicionar seu produto no carrinho;' +
				'\n- Não se esqueça de conferir nossas promoções diárias.'
			)
	
			await bot.sendMessage(update,
				'Então vamos lá!' +
				'\nDiga-me o nome do produto que você quer pesquisar.',
				hasPreviousCart
					? [[
						{label: 'Repetir última compra', command: '/ultima'}
					]]
					: undefined
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
				const cart = await users.getCart(user)
				
				if (cart.length === 0)
					await bot.sendMessage(update,
						'O seu carrinho está vazio!' +
						'\nSe foi um engano, você pode pesquisar por outro produto.',
						[[
							{label: 'Cancelar pedido', command: '/cancelar'}
						]]
					)
				else
				{
					users.nextStage(user)

					await bot.sendMessage(update,
						'Pedido finalizado com sucesso!' +
						'\nAgora, vamos cuidar das informações financeiras... 💰'
					)

					bot.sendPayment(update, cart)
				}
			}
			else if (text === '/cancelar')
			{
				users.remove(user)

				await bot.sendMessage(update,
					'Poxa... Que pena! Seu pedido foi cancelado com sucesso!' +
					'\n\n🤗 Espero te ver por aqui em breve!!!'
				)
			}
			else if (text === '/ultima')
			{
				const cart = await usersInfo.getPreviousCart(user.id)
				await users.setCart(user.id, cart)

				const cartDisplay = await users.getCartDisplay(user)
				await bot.sendMessage(update, cartDisplay)

				await bot.sendMessage(update,
					'Seu carrinho está enchendo! 🛍️' +
					'\nDiga-me qual outro produto você deseja.' +
					'\nSe for só isso mesmo, podemos finalizar a compra.',
					[[{
						label: 'Finalizar',
						command: '/finalizar'
					}]]
				)
			}
			else if (['/selecionar', '/editar'].includes(text.split('_')[0]))
			{
				const productId = Number(text.split('_')[1])
				const product = apiVtex.getProduct(productId)

				if (!product)
				{
					bot.sendMessage(update,
						'⚠️ Não encontrei nenhum produto com esse nome! Vamos tentar outro produto? ⚠️'
					)
				}
				else
				{
					await users.toggleIsUserSelectingQuantity(user, productId)

					bot.sendMessage(update,
						`${text.split('_')[0] === '/editar' ? 'Mudou de ideia? ' : ''}` +
						`Qual a quantidade que você deseja comprar de ${product.name}? 🤔` +
						'\n\nOBS.: Digite somente números maiores que 0',
						[[{
							label: 'Cancelar',
							command: '/cancelar'
						}]]
					)
				}
			}
			else if (text.split('_')[0] === '/remover')
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
			else if (text.split('_')[0] === '/imagem')
			{
				const productId = Number(text.split('_')[1])
				const product = apiVtex.getProduct(productId)

				if (!product)
					return await bot.sendMessage(update, 
						'⚠️ Não encontrei nenhum produto com esse nome! Vamos tentar outro produto? ⚠️',
						[[{
							label: 'Finalizar',
							command: '/finalizar'
						}]]
					)
				
				bot.sendImage(update,
					product.image,
					product.name,
					[[
						{text: 'Selecionar produto', callback_data: `/selecionar_${product.id}`}
					]]
				)
			}
			else
			{
				const search = text.trim()
				const products = apiVtex.searchProducts(search)

				if (products.length === 0)
					return bot.sendMessage(update, 
						'⚠️ Não encontrei nenhum produto com esse nome! Vamos tentar outro produto? ⚠️',
						[[{
							label: 'Finalizar',
							command: '/finalizar'
						}]]
					)

				const productsDisplay = products.map((product) => (
					`\n\n➡️ <b>${product.name}</b>` +
					`\n${formatPrice(product.price)}` +
					`\n${truncateText(product.description, 100)}` +
					`\n<code>Selecionar:</code> /selecionar_${product.id}` +
					`\n<code>Ver imagem:</code> /imagem_${product.id}`
				))

				await bot.sendSearchPaginated(update,
					`Mostrando ${productsDisplay.length} resultados de produtos...`,
					productsDisplay,
					search
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
					`\nQual a quantidade que você deseja comprar de ${product.name}? 🤔` +
					'\n\nOBS.: Digite somente números maiores que 0',
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
				'Seu carrinho está enchendo! 🛍️' +
				'\nDiga-me qual outro produto você deseja.' +
				'\nSe for só isso mesmo, podemos finalizar a compra.',
				[[{
					label: 'Finalizar',
					command: '/finalizar'
				}]]
			)
		}
	},

	checkout: async (text: string, update: Update, user: User) =>
	{
		const cart = await users.getCart(user)
		users.remove(user)

		if (text === '/cancelar')
		{
			return await bot.sendMessage(update,
				'Poxa... Que pena! Seu pedido foi cancelado com sucesso!' +
				'\n\n🤗 Espero te ver por aqui em breve!!!'
			)
		}
		else if (text === '/payed')
		{
			usersInfo.setPreviousCart(user.id, cart)

			return await bot.sendMessage(update,
				'Pedido confirmado com sucesso!' +
				'\n\n🤗 Obrigado por comprar conosco! Volte sempre!!!',
				[[{
					label: 'Visitar nosso site',
					command: 'filler',
					url: 'https://www.avon.com.br/'
				}]]
			)
		}
		else
		{
			await bot.sendMessage(update,
				'Operação inválida!' +
				'\nVocê precisa selecionar uma das opções abaixo. 😉'
			)

			await bot.sendPayment(update, cart)
		}
	}
}

export default stages