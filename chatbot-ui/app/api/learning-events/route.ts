import { NextResponse } from "next/server"
import { getServerProfile } from "@/lib/server/server-chat-helpers"

type LearningEvent = {
  id: string
  type: 'suggestion_clicked'
  payload: any
  timestamp: string
}

const events: Record<string, LearningEvent[]> = {}

export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body = await request.json()
    const event: LearningEvent = {
      id: `${Date.now()}`,
      type: body.type,
      payload: body.payload,
      timestamp: new Date().toISOString()
    }
    const key = profile.user_id
    events[key] = events[key] || []
    events[key].push(event)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const profile = await getServerProfile()
    const key = profile.user_id
    return NextResponse.json({ events: events[key] || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}


