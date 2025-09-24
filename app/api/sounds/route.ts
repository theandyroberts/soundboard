import { NextResponse } from 'next/server'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
	try {
		const dir = join(process.cwd(), 'public', 'sounds')
		const files = await readdir(dir, { withFileTypes: true })
		const items = files
			.filter((d) => d.isFile())
			.filter((d) => /\.(mp3|wav|ogg|m4a)$/i.test(d.name))
			.map((d) => ({ name: d.name, url: `/sounds/${d.name}` }))

		return NextResponse.json({ items })
	} catch (_err) {
		return NextResponse.json({ items: [] })
	}
}
