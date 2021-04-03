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
	}
}

export default api