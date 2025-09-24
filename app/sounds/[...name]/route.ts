import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'

function contentTypeFor(name: string): string {
	const lower = name.toLowerCase()
	if (lower.endsWith('.mp3')) return 'audio/mpeg'
	if (lower.endsWith('.wav')) return 'audio/wav'
	if (lower.endsWith('.ogg')) return 'audio/ogg'
	if (lower.endsWith('.m4a')) return 'audio/mp4'
	return 'application/octet-stream'
}

export async function GET(_req: Request, ctx: { params: { name: string[] } }) {
	try {
		const parts = ctx.params.name || []
		if (parts.length === 0) return new Response('Not Found', { status: 404 })
		const filename = parts.join('/')
		// Prevent path traversal
		if (filename.includes('..')) return new Response('Forbidden', { status: 403 })

		const filePath = join(process.cwd(), 'public', 'sounds', filename)
		const data = await readFile(filePath)
		return new Response(data, {
			headers: {
				'Content-Type': contentTypeFor(filename),
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch (_err) {
		return new Response('Not Found', { status: 404 })
	}
}
