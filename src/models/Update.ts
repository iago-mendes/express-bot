interface Update
{
	update_id: number
	message:
	{
		message_id: number
		text: string
		from: User		
		chat:
		{
			id: number
		}
	}
}

export interface User
{
	id: number
}

export default Update