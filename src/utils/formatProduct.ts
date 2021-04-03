import Product from '../models/Product'

function formatProduct(product: Product)
{
	let formatedProduct =
	{
		id: product.id,
		name: product.name,
		brand: product.brand,
		description: product.description,
		keywords: product.keywords,
		price: 'R$ ' + product.price.toFixed(2).replace('.', ',')
	}

	return formatedProduct
}

export default formatProduct