// formats price

function formatPrice(price: number)
{
	let formatedPrice = 'R$' + price.toFixed(2).replace('.', ',')

	return formatedPrice
}

export default formatPrice