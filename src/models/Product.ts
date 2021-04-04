// defines structure of product received from VTEX APIs

interface Product
{
	id: number
	name: string
	description: string
	keywords: string
	price: number
	image: string
}

export default Product