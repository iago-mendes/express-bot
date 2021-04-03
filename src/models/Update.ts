interface Update
{
	update_id: number
	message: Message
	shipping_query?: ShippingQuery
	pre_checkout_query?: PreCheckoutQuery
	callback_query?:
	{
		id: string
		from: User
		data: string
		message: Message
	}
}

interface Message
{
	message_id: number
	text: string
	from: User		
	chat:
	{
		id: number
	}
	successful_payment?:
	{
		currency: string
		total_amount: number
	}
}

export interface User
{
	id: number
}

export interface ShippingQuery
{
	id: string
	from: User
	invoice_payload: string
	shipping_address:
	{
		country_code: string,
		state: string,
		city: string,
		street_line1: string,
		street_line2: string,
		post_code: string
	}
}

export interface PreCheckoutQuery
{
	id: string
	from: User
	currency: string
	total_amount: number
	invoice_payload: string
	shipping_option_id: string
}

export default Update