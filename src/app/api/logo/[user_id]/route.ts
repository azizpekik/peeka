import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

const LOGO_DIR = join(process.cwd(), 'public', 'logos')

export async function POST(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split('/')
    const user_id = segments[segments.length - 1]
    
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!user_id || !file) {
      return NextResponse.json({ error: 'user_id dan file wajib diisi' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await mkdir(LOGO_DIR, { recursive: true })

    const filename = `${user_id}.png`
    const filepath = join(LOGO_DIR, filename)
    await writeFile(filepath, buffer)

    const logo_url = `/logos/${filename}`

    return NextResponse.json({ success: true, logo_url })
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split('/')
    const user_id = segments[segments.length - 1]

    if (!user_id) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const filename = `${user_id}.png`
    const filepath = join(LOGO_DIR, filename)

    try {
      await unlink(filepath)
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}