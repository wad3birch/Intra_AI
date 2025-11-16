import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

interface ABTestAnalysis {
  summary: string
  keyDifferences: string[]
  strengths: {
    versionA: string[]
    versionB: string[]
  }
  weaknesses: {
    versionA: string[]
    versionB: string[]
  }
  recommendation: string
  confidence: number
  industryAnalysis?: {
    industry: string
    specificMetrics: {
      versionA: Record<string, number>
      versionB: Record<string, number>
    }
    industryRecommendations: string[]
    benchmarkComparison: {
      industryAverage: Record<string, number>
      performance: {
        versionA: Record<string, number>
        versionB: Record<string, number>
      }
    }
  }
}

// 行业特定分析配置
const industryAnalysisConfig = {
  general: {
    metrics: ['content_quality', 'readability', 'engagement', 'clarity'],
    prompts: {
      content_quality: "Analyze overall content quality including structure, flow, and coherence.",
      readability: "Evaluate readability and accessibility for general audiences.",
      engagement: "Assess potential for audience engagement and interaction.",
      clarity: "Measure clarity of communication and message delivery."
    }
  },
  ecommerce: {
    metrics: ['conversion_potential', 'product_appeal', 'price_sensitivity', 'urgency_creation'],
    prompts: {
      conversion_potential: "Analyze the conversion potential based on call-to-action effectiveness, value proposition clarity, and purchase motivation triggers.",
      product_appeal: "Evaluate product appeal based on benefit highlighting, feature descriptions, and emotional connection.",
      price_sensitivity: "Assess price sensitivity indicators and value communication effectiveness.",
      urgency_creation: "Measure urgency creation through scarcity, time-limited offers, and action prompts."
    }
  },
  education: {
    metrics: ['learning_difficulty', 'knowledge_coverage', 'engagement_potential', 'clarity_score'],
    prompts: {
      learning_difficulty: "Analyze the learning difficulty level appropriate for the target audience.",
      knowledge_coverage: "Evaluate the comprehensiveness of knowledge coverage and topic depth.",
      engagement_potential: "Assess potential for student engagement and interaction.",
      clarity_score: "Measure clarity of explanations and concept presentation."
    }
  },
  marketing: {
    metrics: ['open_rate_potential', 'click_rate_potential', 'engagement_score', 'spam_risk'],
    prompts: {
      open_rate_potential: "Analyze subject line effectiveness and email open rate potential.",
      click_rate_potential: "Evaluate call-to-action effectiveness and click-through potential.",
      engagement_score: "Assess potential for social media engagement and sharing.",
      spam_risk: "Evaluate spam risk factors and deliverability issues."
    }
  },
  healthcare: {
    metrics: ['credibility_score', 'accessibility', 'compliance_risk', 'patient_trust'],
    prompts: {
      credibility_score: "Evaluate medical accuracy and source credibility.",
      accessibility: "Assess readability for patients with varying health literacy levels.",
      compliance_risk: "Identify potential regulatory compliance issues.",
      patient_trust: "Measure trust-building elements and patient confidence factors."
    }
  },
  finance: {
    metrics: ['trust_score', 'risk_clarity', 'regulatory_compliance', 'persuasion_effectiveness'],
    prompts: {
      trust_score: "Evaluate trust-building elements and credibility indicators.",
      risk_clarity: "Assess clarity of risk disclosure and financial implications.",
      regulatory_compliance: "Check for regulatory compliance and legal requirements.",
      persuasion_effectiveness: "Measure persuasion effectiveness while maintaining ethical standards."
    }
  },
  technology: {
    metrics: ['technical_accuracy', 'complexity_management', 'user_friendliness', 'innovation_appeal'],
    prompts: {
      technical_accuracy: "Evaluate technical accuracy and implementation feasibility.",
      complexity_management: "Assess how well technical complexity is managed and explained.",
      user_friendliness: "Measure user-friendliness and accessibility for non-technical users.",
      innovation_appeal: "Evaluate innovation appeal and cutting-edge technology presentation."
    }
  }
}

export async function POST(request: Request) {
  const json = await request.json()
  const { versionA, versionB, industry = "general", model = "gpt-4-turbo-preview", temperature = 0.3 } = json as {
    versionA: string
    versionB: string
    industry?: string
    model?: string
    temperature?: number
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    // 获取行业配置
    const industryConfig = industryAnalysisConfig[industry as keyof typeof industryAnalysisConfig]
    if (!industryConfig) {
      throw new Error(`Unsupported industry: ${industry}`)
    }

    // 构建行业特定的分析提示
    const industryMetrics = industryConfig.metrics
    const industryPrompts = industryConfig.prompts

    const analysisPrompt = `You are an expert A/B testing analyst specializing in ${industry} content. Please analyze the following two versions of content and provide a comprehensive comparison.

Version A:
${versionA}

Version B:
${versionB}

Please provide your analysis in the following JSON format:
{
  "summary": "A brief overall comparison of both versions with ${industry} context",
  "keyDifferences": [
    "List of main differences between the versions relevant to ${industry}"
  ],
  "strengths": {
    "versionA": ["List of strengths for version A in ${industry} context"],
    "versionB": ["List of strengths for version B in ${industry} context"]
  },
  "weaknesses": {
    "versionA": ["List of weaknesses for version A in ${industry} context"],
    "versionB": ["List of weaknesses for version B in ${industry} context"]
  },
  "recommendation": "Your recommendation on which version to choose and why, considering ${industry} best practices",
  "confidence": 0.85,
  "industryAnalysis": {
    "industry": "${industry}",
    "specificMetrics": {
      "versionA": {
        ${industryMetrics.map(metric => `"${metric}": ${Math.random().toFixed(2)}`).join(',\n        ')}
      },
      "versionB": {
        ${industryMetrics.map(metric => `"${metric}": ${Math.random().toFixed(2)}`).join(',\n        ')}
      }
    },
    "industryRecommendations": [
      "Specific recommendations for ${industry} optimization",
      "Best practices for ${industry} content",
      "Industry-specific improvement suggestions"
    ],
    "benchmarkComparison": {
      "industryAverage": {
        ${industryMetrics.map(metric => `"${metric}": ${(Math.random() * 0.3 + 0.6).toFixed(2)}`).join(',\n        ')}
      },
      "performance": {
        "versionA": {
          ${industryMetrics.map(metric => `"${metric}": ${Math.random().toFixed(2)}`).join(',\n          ')}
        },
        "versionB": {
          ${industryMetrics.map(metric => `"${metric}": ${Math.random().toFixed(2)}`).join(',\n          ')}
        }
      }
    }
  }
}

Focus on ${industry}-specific factors:
${industryMetrics.map(metric => `- ${metric}: ${industryPrompts[metric as keyof typeof industryPrompts]}`).join('\n')}

Provide specific, actionable insights for ${industry} content optimization. The confidence score should reflect how certain you are about your analysis (0.0 to 1.0).`

    const messages = [
      {
        role: "user" as const,
        content: analysisPrompt
      }
    ]

    const response = await openai.chat.completions.create({
      model: model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: temperature,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content

    if (!content) {
      throw new Error("No response content received")
    }

    let analysis: ABTestAnalysis
    try {
      analysis = JSON.parse(content)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Failed to parse analysis response as JSON")
      }
    }

    // Validate the response structure
    if (!analysis.summary || !analysis.keyDifferences || !analysis.strengths || !analysis.weaknesses || !analysis.recommendation) {
      throw new Error("Invalid analysis response structure")
    }

    // Ensure confidence is a number between 0 and 1
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      analysis.confidence = 0.8 // Default confidence
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
}
