import { FC, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageMarkdown } from "@/components/messages/message-markdown"
import { ChatbotUIContext } from "@/context/context"
import { useContext } from "react"
import { IconX, IconRefresh, IconDownload, IconStar, IconTrendingUp } from "@tabler/icons-react"
import { LLMID } from "@/types"

interface ABTestResult {
  modelId: LLMID
  modelName: string
  response: string
  responseTime: number
  tokenCount: number
  scores: Record<string, number>
  timestamp: Date
}

interface ABTestConfig {
  id: string
  name: string
  description: string
  testPrompt: string
  models: {
    id: string
    modelId: LLMID
    modelName: string
    customPrompt?: string
    temperature?: number
  }[]
  comparisonCriteria: string[]
  createdAt: Date
}

interface ABTestResultsProps {
  config: ABTestConfig
  results: ABTestResult[]
  onClose: () => void
  onRerunTest: () => void
}

export const ABTestResults: FC<ABTestResultsProps> = ({ 
  config, 
  results, 
  onClose, 
  onRerunTest 
}) => {
  const { profile } = useContext(ChatbotUIContext)
  const [selectedTab, setSelectedTab] = useState("responses")
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false)
  const [comparisonAnalysis, setComparisonAnalysis] = useState<string>("")

  const generateComparisonAnalysis = async () => {
    setIsGeneratingComparison(true)
    setComparisonAnalysis("")
    
    try {
      // Create a comprehensive comparison prompt
      const comparisonPrompt = `You are an expert AI model evaluator. Please analyze and compare the following AI model responses to the same prompt and provide a detailed comparison.

**Original Prompt:** ${config.testPrompt}

**Comparison Criteria:** ${config.comparisonCriteria.join(", ")}

**Model Responses:**
${results.map((result, index) => `
**Model ${String.fromCharCode(65 + index)} (${result.modelName}):**
${result.response}
`).join("\n")}

Please provide a comprehensive analysis including:
1. **Overall Quality Assessment** - Which response is better overall and why
2. **Criterion-by-Criterion Analysis** - How each model performs on the specified criteria
3. **Strengths and Weaknesses** - Key strengths and areas for improvement for each model
4. **Use Case Recommendations** - When to use each model based on this test
5. **Summary Table** - A markdown table comparing the models

Format your response in clear sections with headers and include a comparison table at the end.`

      const response = await fetch('/api/ab-test/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: comparisonPrompt,
          model: "gpt-4-turbo-preview",
          temperature: 0.3
        })
      })

      if (response.ok && response.body) {
        // Create an abort controller for the stream
        const abortController = new AbortController()
        
        // Handle the streaming response properly
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              break
            }
            
            if (value) {
              const chunk = decoder.decode(value, { stream: true })
              setComparisonAnalysis(prev => prev + chunk)
            }
          }
        } finally {
          reader.releaseLock()
        }
      } else {
        const errorData = await response.json()
        setComparisonAnalysis(`Error generating comparison analysis: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Error generating comparison:', error)
      setComparisonAnalysis("Error generating comparison analysis.")
    } finally {
      setIsGeneratingComparison(false)
    }
  }

  const exportResults = () => {
    const exportData = {
      testConfig: config,
      results: results,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ab-test-${config.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getAverageScore = (scores: Record<string, number>) => {
    const values = Object.values(scores)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  const getBestModel = () => {
    if (results.length === 0) return null
    return results.reduce((best, current) => 
      getAverageScore(current.scores) > getAverageScore(best.scores) ? current : best
    )
  }

  const bestModel = getBestModel()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconTrendingUp size={20} />
                A/B Test Results: {config.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportResults}>
                <IconDownload size={16} className="mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onRerunTest}>
                <IconRefresh size={16} className="mr-1" />
                Rerun
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <IconX size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-6">
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="responses" className="p-6 space-y-4">
              <div className="space-y-4">
                <Card className="p-4 bg-muted/50">
                  <h3 className="font-semibold mb-2">Test Prompt:</h3>
                  <p className="text-sm">{config.testPrompt}</p>
                </Card>

                {results.map((result, index) => (
                  <Card key={result.modelId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={bestModel?.modelId === result.modelId ? "default" : "outline"}>
                          Model {String.fromCharCode(65 + index)}
                        </Badge>
                        <span className="font-medium">{result.modelName}</span>
                        {bestModel?.modelId === result.modelId && (
                          <IconStar size={16} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.responseTime}ms • {result.tokenCount} tokens
                      </div>
                    </div>
                    
                    <ScrollArea className="h-64 w-full">
                      <div className="pr-4">
                        <MessageMarkdown content={result.response} />
                      </div>
                    </ScrollArea>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result, index) => (
                    <Card key={result.modelId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={bestModel?.modelId === result.modelId ? "default" : "outline"}>
                          Model {String.fromCharCode(65 + index)}
                        </Badge>
                        <span className="font-medium">{result.modelName}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Response Time:</span>
                          <span>{result.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Token Count:</span>
                          <span>{result.tokenCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Average Score:</span>
                          <span className="font-medium">
                            {getAverageScore(result.scores).toFixed(1)}/10
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Criterion Scores:</h4>
                        {config.comparisonCriteria.map(criterion => (
                          <div key={criterion} className="flex justify-between text-sm">
                            <span className="capitalize">{criterion}:</span>
                            <span>{result.scores[criterion] || 0}/10</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {bestModel?.modelName}
                      </div>
                      <div className="text-sm text-muted-foreground">Best Overall</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.min(...results.map(r => r.responseTime))}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Fastest Response</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.max(...results.map(r => r.tokenCount))}
                      </div>
                      <div className="text-sm text-muted-foreground">Most Detailed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {results.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Models Tested</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI-Powered Comparison Analysis</h3>
                  <Button 
                    onClick={generateComparisonAnalysis}
                    disabled={isGeneratingComparison}
                  >
                    {isGeneratingComparison ? "Generating..." : "Generate Analysis"}
                  </Button>
                </div>

                {comparisonAnalysis ? (
                  <Card className="p-4">
                    <ScrollArea className="h-96 w-full">
                      <div className="pr-4">
                        <MessageMarkdown content={comparisonAnalysis} />
                      </div>
                    </ScrollArea>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Click "Generate Analysis" to get an AI-powered comparison of the model responses.
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}