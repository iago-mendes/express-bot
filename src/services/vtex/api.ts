/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'

import Product from '../../models/Product'

const vtex:
{
	products: Product[]
} = require(path.resolve('db', 'vtex.json'))
const products = vtex.products

const api =
{
	searchProducts: (search: string) =>
	{
		const results = products
			.filter(product =>
			{
				const searchName = product.name.toLowerCase().includes(search.toLowerCase())
				const searchBrand = product.brand.toLowerCase().includes(search.toLowerCase())
				const searchDescription = product.description.toLowerCase().includes(search.toLowerCase())
				const searchKeywords = product.keywords.toLowerCase().includes(search.toLowerCase())

				return searchName || searchBrand || searchDescription || searchKeywords
			})

		return results
	},

	getProduct: (id: number) =>
	{
		const product = products.find(product => product.id === id)
		return product
	},
	
	calcularFrete: async (cep: string) =>
	{
		const shippingOptions =
		[
			{
				id: '1',
				title: 'SEDEX (8 dias)',
				prices:
				[{
					label: 'Frete',
					amount: 1556
				}]
			},
			{
				id: '2',
				title: 'PAC (12 dias)',
				prices:
				[{
					label: 'Frete',
					amount: 756
				}]
			}
		]
		
		return shippingOptions
	}
}

export default api