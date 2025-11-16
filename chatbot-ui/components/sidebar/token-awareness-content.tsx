"use client"

import { FC, useState } from "react"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { useRouter } from "next/navigation"

export const TokenAwarenessContent: FC = () => {
  const [text, setText] = useState("")
  const router = useRouter()

  const handleAnalyze = () => {
    if (text.trim()) {
      // Navigate to token awareness page with text as query parameter
      const encodedText = encodeURIComponent(text)
      // Extract workspace ID from current path
      const pathParts = window.location.pathname.split('/')
      const workspaceId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]
      router.push(`/${workspaceId}/token-awareness?text=${encodedText}`)
    }
  }

  return (
    <div className="flex h-full flex-col p-4">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-l">Alignment Signal Analyzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Input text to analyze
            </label>
            <Textarea
              placeholder="Please input the text to analyze..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={!text.trim()}
            className="w-full"
          >
            Start analyzing
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}