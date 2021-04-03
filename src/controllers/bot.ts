import Update from '../models/Update'
import api from '../services//telegram/api'
import stages from './stages'
import users from './users'

const bot =
{
	getUpdates: () =>
	{
		let offset: number | undefined = undefined

		setInterval(() =>
		{
			const data = offset
				? {offset}
				: {}

			api.post('getUpdates', data)
				.then(res =>
				{
					const update = res.data.result[0]
					if (update)
					{
						offset = update.update_id + 1

						api.post('sendChatAction',
							{
								chat_id: update.message.chat.id,
								action: 'typing'
							})
						
						bot.checkStage(update)
					}
				})
				.catch(error =>
				{
					console.error('[error]', error.response.data)
				})
		}, 3*1000)
	},

	checkStage: async (update: Update) =>
	{
		const user = update.message.from
		const messageId = update.message.message_id
		const text = update.message.text.trim()

		const hasMessageBeenProcessed = await users.hasMessageBeenProcessed(user, messageId)
		if (hasMessageBeenProcessed)
			return
		else
			await users.addProcessedMessage(user, messageId)

		const userStage = await users.getStage(user)

		if (userStage === 0)
			await stages.welcome(update)
		else if (userStage === 1)
			await stages.selectProducts(text, update, user)
		else if (userStage === 2)
			await stages.reviewProducts(text, update, user)
	},

	sendMessage: async (update: Update, message: string) =>
	{
		const params =
		{
			chat_id: update.message.chat.id,
			text: message,
			parse_mode: 'HTML'
		}
		await api.post('sendMessage', params)
			.catch(error =>
			{
				console.error('[error when sending message]', error)
			})
	}
}

export default bot