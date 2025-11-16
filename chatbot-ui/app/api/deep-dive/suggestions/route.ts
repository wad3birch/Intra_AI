import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const { selectedText, originalContent, originalQuestion, chatSettings, modelId, contextType } = await request.json() as {
      selectedText: string
      originalContent: string
      originalQuestion?: string
      chatSettings: ChatSettings
      modelId?: string
      contextType?: string
    }

    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    // Context-aware system prompt
    const getContextPrompt = (contextType: string) => {
      switch (contextType) {
        case 'code':
          return `Generate 3-4 focused questions about the selected code. Focus on:
- Code explanation and functionality
- Best practices and improvements
- Common issues and debugging
- Performance considerations
Return JSON with format:
{
  "questions": [
    {"id": "1", "question": "brief question text", "category": "Explanation|Best Practice|Debugging|Performance"}
  ]
}`
        case 'data':
          return `Generate 3-4 analytical questions about the selected data. Focus on:
- Data interpretation and meaning
- Trends and patterns
- Implications and insights
- Comparisons and context
Return JSON with format:
{
  "questions": [
    {"id": "1", "question": "brief question text", "category": "Interpretation|Analysis|Implications|Comparison"}
  ]
}`
        case 'concept':
          return `Generate 3-4 educational questions about the selected concept. Focus on:
- Definition and explanation
- Examples and applications
- Related concepts and connections
- Practical usage
Return JSON with format:
{
  "questions": [
    {"id": "1", "question": "brief question text", "category": "Definition|Examples|Connections|Applications"}
  ]
}`
        default:
          return `Generate 3-4 concise exploration questions about the selected text. Return JSON with format:
{
  "questions": [
    {"id": "1", "question": "brief question text", "category": "Definition|Example|Context|Detail"}
  ]
}`
      }
    }

    const systemPrompt = getContextPrompt(contextType || 'general')

    const userPrompt = `Selected: "${selectedText}"

From context: ${originalContent.substring(0, 500)}...

Generate focused questions to help understand this selection better.`

    const response = await openai.chat.completions.create({
      model: modelId || chatSettings.model as any,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No response content")
    }

    const parsed = JSON.parse(content)
    return Response.json(parsed)

  } catch (error: any) {
    console.error("Deep Dive suggestions failed:", error)
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestions" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
