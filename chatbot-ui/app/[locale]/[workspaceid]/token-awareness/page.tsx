"use client"

import { FC, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WithTooltip } from "@/components/ui/with-tooltip"
import { ArrowLeft, Eye, BarChart3, Activity, Target, Zap } from "lucide-react"

interface TokenScore {
  token: string
  score: number
}

export default function TextAwarenessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [text, setText] = useState("")
  const [scores, setScores] = useState<TokenScore[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const textParam = searchParams.get("text")
    if (textParam) {
      setText(decodeURIComponent(textParam))
    }
  }, [searchParams])

  const analyzeText = async () => {
    if (!text.trim()) return

    setLoading(true)
    try {
      // 按词（token）分割，而不是按字符
      // 使用空格和标点符号作为分隔符
      const tokens = text.split(/(\s+|[.,!?;:])/).filter(token => token.trim() !== "")
      
      // 这里应该调用实际的BERT模型API
      // 现在使用模拟数据
      const mockScores = tokens.map((token, index) => ({
        token: token,
        score: Math.random() // 模拟0-1之间的分数
      }))
      
      setScores(mockScores)
    } catch (error) {
      console.error("分析失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTokenColor = (score: number) => {
    // 数字越大，蓝色越深
    const intensity = Math.floor(score * 255)
    return `rgb(0, 0, ${intensity})`
  }

  const getTokenBackgroundColor = (score: number) => {
    // 数字越大，背景蓝色越深
    const intensity = Math.floor(score * 100)
    return `rgba(0, 100, 255, ${score * 0.3})`
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* 优化的Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Eye size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Alignment Signal Analyzer
                </h1>
                <p className="text-sm text-gray-500">Analyze text importance and semantic awareness</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Input Text</CardTitle>
            </CardHeader>
            <CardContent className="text-base">
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Please input the text to analyze..."
                  className="w-full h-32 p-3 border rounded-md resize-none"
                />
                <Button 
                  onClick={analyzeText}
                  disabled={!text.trim() || loading}
                  className="w-full"
                >
                  {loading ? "Analyzing..." : "Analyze Text Importance"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="text-base">
              {scores.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={20} className="text-blue-600" />
                    <h2 className="text-lg font-semibold">Text Analysis Results</h2>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Word Importance Score (0-1, darker colors indicate higher importance)
                  </div>
                  <div className="flex flex-wrap gap-1 p-4 border rounded-md bg-gray-50">
                    {scores.map((item, index) => (
                      <WithTooltip
                        key={index}
                        delayDuration={200}
                        side="top"
                        display={
                          <div className="text-sm">
                            <div className="font-semibold mb-1">Token: "{item.token}"</div>
                            <div>Importance Score: <span className="font-mono">{item.score.toFixed(3)}</span></div>
                            <div className="text-xs text-gray-400 mt-1">({(item.score * 100).toFixed(1)}%)</div>
                          </div>
                        }
                        trigger={
                          <span
                            className="px-2 py-1 rounded text-sm font-mono cursor-pointer"
                            style={{
                              color: getTokenColor(item.score),
                              backgroundColor: getTokenBackgroundColor(item.score)
                            }}
                          >
                            {item.token}
                          </span>
                        }
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Hover to view the specific importance score
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Click "Analyze" button to start analyzing the text
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
