import { FC, useState, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatbotUIContext } from "@/context/context"
import { ABTestConfig } from "./ab-test-config"
import { ABTestResults } from "./ab-test-results"
import { IconFlask, IconTrendingUp, IconClock, IconCheck } from "@tabler/icons-react"
import { LLMID, ModelProvider } from "@/types"
import { buildFinalMessages } from "@/lib/build-prompt"
import { LLM_LIST } from "@/lib/models/llm/llm-list"

interface ABTestResult {
  modelId: LLMID
  modelName: string
  response: string
  responseTime: number
  tokenCount: number
  scores: Record<string, number>
  timestamp: Date
}

interface ABTestManagerProps {
  onClose: () => void
}

export const ABTestManager: FC<ABTestManagerProps> = ({ onClose }) => {
  const { 
    models, 
    availableHostedModels, 
    availableLocalModels, 
    availableOpenRouterModels,
    profile 
  } = useContext(ChatbotUIContext)

  const [showConfig, setShowConfig] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentTest, setCurrentTest] = useState<any>(null)
  const [testResults, setTestResults] = useState<ABTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runABTest = async (config: any) => {
    setIsRunning(true)
    setCurrentTest(config)
    
    try {
      const results: ABTestResult[] = []
      
      // Run each model
      for (const modelConfig of config.models) {
        const startTime = Date.now()
        
        try {
          // Find the model data
          const allModels = [
            ...models.map(model => ({
              modelId: model.model_id as LLMID,
              modelName: model.name,
              provider: "custom" as ModelProvider,
              hostedId: model.id,
              platformLink: "",
              imageInput: false
            })),
            ...LLM_LIST,
            ...availableHostedModels,
            ...availableLocalModels,
            ...availableOpenRouterModels
          ]

          const modelData = allModels.find(m => m.modelId === modelConfig.modelId)
          
          if (!modelData) {
            throw new Error(`Model ${modelConfig.modelId} not found`)
          }

          // Prepare the chat payload
          const chatSettings = {
            model: modelConfig.modelId,
            prompt: modelConfig.customPrompt || "You are a helpful AI assistant.",
            temperature: modelConfig.temperature || 0.7,
            contextLength: 4000,
            includeProfileContext: false,
            includeWorkspaceInstructions: false,
            embeddingsProvider: "openai" as const
          }

          const messages = [
            {
              role: "user" as const,
              content: config.testPrompt
            }
          ]

          // Build final messages with proper formatting
          const formattedMessages = await buildFinalMessages(
            {
              chatSettings,
              workspaceInstructions: "",
              chatMessages: messages,
              assistant: null,
              messageFileItems: [],
              chatFileItems: []
            },
            profile!,
            []
          )

          // Determine the correct API endpoint based on model provider
          let apiEndpoint = ""
          let requestBody: any = {
            chatSettings,
            messages: formattedMessages
          }

          if (modelData.provider === "custom") {
            apiEndpoint = "/api/chat/custom"
            requestBody.customModelId = modelData.hostedId
          } else if (modelData.provider === "ollama") {
            // Handle local models differently
            const response = await fetch(process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/chat", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: modelConfig.modelId,
                messages: formattedMessages,
                options: {
                  temperature: modelConfig.temperature || 0.7
                }
              })
            })

            if (!response.ok) {
              throw new Error(`Ollama API error: ${response.statusText}`)
            }

            const data = await response.json()
            const responseTime = Date.now() - startTime
            
            // Generate scores
            const scores = generateScores(data.message.content, config.comparisonCriteria)
            
            results.push({
              modelId: modelConfig.modelId,
              modelName: modelConfig.modelName,
              response: data.message.content,
              responseTime,
              tokenCount: data.message.content.split(' ').length,
              scores,
              timestamp: new Date()
            })
            continue
          } else {
            apiEndpoint = `/api/chat/${modelData.provider}`
          }

          // Make the API call
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          const responseTime = Date.now() - startTime
          
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`)
          }

          // Handle streaming response
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          let fullResponse = ""
          const decoder = new TextDecoder()

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value, { stream: true })
              fullResponse += chunk
            }
          } finally {
            reader.releaseLock()
          }

          // Generate scores
          const scores = generateScores(fullResponse, config.comparisonCriteria)
          
          results.push({
            modelId: modelConfig.modelId,
            modelName: modelConfig.modelName,
            response: fullResponse,
            responseTime,
            tokenCount: fullResponse.split(' ').length,
            scores,
            timestamp: new Date()
          })

        } catch (error) {
          const responseTime = Date.now() - startTime
          results.push({
            modelId: modelConfig.modelId,
            modelName: modelConfig.modelName,
            response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            responseTime,
            tokenCount: 0,
            scores: config.comparisonCriteria.reduce((acc, criterion) => {
              acc[criterion] = 0
              return acc
            }, {} as Record<string, number>),
            timestamp: new Date()
          })
        }
      }
      
      setTestResults(results)
      setShowResults(true)
      setShowConfig(false)
    } catch (error) {
      console.error('Error running A/B test:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const generateScores = (response: string, criteria: string[]): Record<string, number> => {
    const scores: Record<string, number> = {}
    
    criteria.forEach(criterion => {
      let score = 5 // Base score
      
      // Adjust based on response length (more detailed = higher score)
      if (response.length > 500) score += 2
      else if (response.length > 200) score += 1
      
      // Adjust based on criterion
      switch (criterion.toLowerCase()) {
        case 'accuracy':
          score += response.includes('error') || response.includes('incorrect') ? -1 : 1
          break
        case 'creativity':
          score += response.includes('creative') || response.includes('innovative') ? 2 : 0
          break
        case 'clarity':
          score += response.split('.').length > 3 ? 1 : 0
          break
        case 'completeness':
          score += response.length > 300 ? 2 : 1
          break
        case 'relevance':
          score += response.length > 100 ? 1 : 0
          break
        case 'helpfulness':
          score += response.includes('help') || response.includes('assist') ? 1 : 0
          break
      }
      
      scores[criterion] = Math.min(10, Math.max(1, score))
    })
    
    return scores
  }

  if (showConfig) {
    return (
      <ABTestConfig
        onStartTest={runABTest}
        onClose={() => setShowConfig(false)}
      />
    )
  }

  if (showResults && currentTest) {
    return (
      <ABTestResults
        config={currentTest}
        results={testResults}
        onClose={() => {
          setShowResults(false)
          setCurrentTest(null)
          setTestResults([])
        }}
        onRerunTest={() => runABTest(currentTest)}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconFlask size={20} />
              A/B Testing Lab
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <IconTrendingUp size={32} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Compare AI Models</h3>
              <p className="text-muted-foreground">
                Test different models with the same prompt and get detailed comparisons
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <IconFlask size={24} className="mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Configure Test</h4>
              <p className="text-sm text-muted-foreground">
                Set up your test prompt and select models to compare
              </p>
            </Card>
            
            <Card className="p-4 text-center">
              <IconClock size={24} className="mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Run Comparison</h4>
              <p className="text-sm text-muted-foreground">
                Execute the test and collect responses from all models
              </p>
            </Card>
            
            <Card className="p-4 text-center">
              <IconCheck size={24} className="mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">Analyze Results</h4>
              <p className="text-sm text-muted-foreground">
                Get AI-powered analysis and detailed metrics
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Available Models</h4>
            <div className="flex flex-wrap gap-2">
              {[
                ...models.map(m => ({ name: m.name, type: "Custom" })),
                ...availableHostedModels.map(m => ({ name: m.modelName, type: "Hosted" })),
                ...availableLocalModels.map(m => ({ name: m.modelName, type: "Local" })),
                ...availableOpenRouterModels.map(m => ({ name: m.modelName, type: "OpenRouter" }))
              ].slice(0, 8).map((model, index) => (
                <Badge key={index} variant="outline">
                  {model.name}
                </Badge>
              ))}
              {[
                ...models,
                ...availableHostedModels,
                ...availableLocalModels,
                ...availableOpenRouterModels
              ].length > 8 && (
                <Badge variant="outline">
                  +{[
                    ...models,
                    ...availableHostedModels,
                    ...availableLocalModels,
                    ...availableOpenRouterModels
                  ].length - 8} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={() => setShowConfig(true)}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? "Running Test..." : "Start New A/B Test"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
