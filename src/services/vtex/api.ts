/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'

import Product from '../../models/Product'

const vtex:
{
	products: Product[]
	shippingOptions: Array<Array<
	{
		id: string
		title: string
		price: number
		deliveryTime: string
	}>>
} = require(path.resolve('db', 'vtex.json'))
const products = vtex.products

const api =
{
	searchProducts: (search: string) =>
	{
		const searchs = search.split(' ')

		let filteredProducts = products
		searchs.map(search =>
		{
			filteredProducts = filteredProducts
				.filter(product =>
				{
					const searchName = product.name.toLowerCase().includes(search.toLowerCase())
					const searchBrand = product.brand.toLowerCase().includes(search.toLowerCase())
					const searchDescription = product.description.toLowerCase().includes(search.toLowerCase())
					const searchKeywords = product.keywords.toLowerCase().includes(search.toLowerCase())

					return searchName || searchBrand || searchDescription || searchKeywords
				})
		})
		
		return filteredProducts
	},

	getProduct: (id: number) =>
	{
		const product = products.find(product => product.id === id)
		return product
	},
	
	calcularFrete: async (cep: string) =>
	{
		const lastDigit = Number(cep[cep.length-1])
		const index = lastDigit % 2 === 0 ? 0 : 1
		const rawShippingOptions = vtex.shippingOptions[index]

		const shippingOptions = rawShippingOptions.map(option => (
			{
				id: option.id,
				title: `${option.title} (${option.deliveryTime})`,
				prices:
				[{
					label: 'Frete',
					amount: Math.round(option.price * 100)
				}]
			}))
		
		return shippingOptions
	}
}

export default api