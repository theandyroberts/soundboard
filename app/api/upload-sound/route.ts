import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export const runtime = 'nodejs'

function sanitizeFilename(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as unknown as File | null
		const label = (formData.get('label') as string | null) ?? undefined

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 })
		}

		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		const originalName = file.name || 'sound'
		const baseName = sanitizeFilename((label || originalName).replace(/\.[^./]+$/, '')) || 'sound'
		const extMatch = originalName.match(/\.[a-z0-9]+$/i)
		const ext = (extMatch ? extMatch[0] : '.mp3').toLowerCase()

		const unique = randomBytes(4).toString('hex')
		const filename = `${baseName}-${unique}${ext}`

		const dir = join(process.cwd(), 'public', 'sounds')
		await mkdir(dir, { recursive: true })
		const fullPath = join(dir, filename)

		await writeFile(fullPath, buffer)

		const url = `/sounds/${filename}`
		return NextResponse.json({ url, name: filename })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
	}
}
