export default function truncateText(text: string, length: number)
{
	let truncated = text

	if (truncated.length > length)
		truncated = truncated.substr(0, length-3) + '...'

	return truncated
}