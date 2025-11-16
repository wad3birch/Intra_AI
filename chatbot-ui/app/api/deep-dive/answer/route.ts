import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const { selectedText, originalContent, originalQuestion, question, chatSettings, modelId } = await request.json() as {
      selectedText: string
      originalContent: string
      originalQuestion?: string
      question: string
      chatSettings: ChatSettings
      modelId?: string
    }

    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    const systemPrompt = `Answer the user's question about their selected text. Be concise, clear, and directly address their question. Use examples when helpful.`

    const userPrompt = `Selected text: "${selectedText}"

Context: ${originalContent.substring(0, 600)}...

Question: ${question}

Please answer this question about the selected text.`

    const response = await openai.chat.completions.create({
      model: modelId || chatSettings.model as any,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    })

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)

  } catch (error: any) {
    console.error("Deep Dive answer generation failed:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate answer" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
