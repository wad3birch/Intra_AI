import { FC, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatbotUIContext } from "@/context/context"
import { useContext } from "react"
import { LLMID } from "@/types"
import { IconX, IconPlus, IconSettings } from "@tabler/icons-react"

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

interface ABTestConfigProps {
  onStartTest: (config: ABTestConfig) => void
  onClose: () => void
}

export const ABTestConfig: FC<ABTestConfigProps> = ({ onStartTest, onClose }) => {
  const { 
    models, 
    availableHostedModels, 
    availableLocalModels, 
    availableOpenRouterModels 
  } = useContext(ChatbotUIContext)

  const [config, setConfig] = useState<ABTestConfig>({
    id: `test_${Date.now()}`,
    name: "",
    description: "",
    testPrompt: "",
    models: [
      { id: "model_a", modelId: "gpt-4-turbo-preview" as LLMID, modelName: "GPT-4 Turbo", temperature: 0.7 },
      { id: "model_b", modelId: "gpt-3.5-turbo" as LLMID, modelName: "GPT-3.5 Turbo", temperature: 0.7 }
    ],
    comparisonCriteria: ["accuracy", "creativity", "clarity", "completeness"],
    createdAt: new Date()
  })

  const allModels = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as const,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...availableHostedModels,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ]

  const addModel = () => {
    const newModel = {
      id: `model_${Date.now()}`,
      modelId: "gpt-4-turbo-preview" as LLMID,
      modelName: "GPT-4 Turbo",
      temperature: 0.7
    }
    setConfig(prev => ({
      ...prev,
      models: [...prev.models, newModel]
    }))
  }

  const removeModel = (modelId: string) => {
    setConfig(prev => ({
      ...prev,
      models: prev.models.filter(m => m.id !== modelId)
    }))
  }

  const updateModel = (modelId: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      models: prev.models.map(m => 
        m.id === modelId ? { ...m, [field]: value } : m
      )
    }))
  }

  const addCriterion = () => {
    setConfig(prev => ({
      ...prev,
      comparisonCriteria: [...prev.comparisonCriteria, ""]
    }))
  }

  const removeCriterion = (index: number) => {
    setConfig(prev => ({
      ...prev,
      comparisonCriteria: prev.comparisonCriteria.filter((_, i) => i !== index)
    }))
  }

  const updateCriterion = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      comparisonCriteria: prev.comparisonCriteria.map((c, i) => 
        i === index ? value : c
      )
    }))
  }

  const handleStartTest = () => {
    if (config.name && config.testPrompt && config.models.length >= 2) {
      onStartTest(config)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconSettings size={20} />
              A/B Test Configuration
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <IconX size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                placeholder="e.g., Creative Writing Comparison"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-description">Description</Label>
              <Input
                id="test-description"
                placeholder="Brief description of the test"
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-prompt">Test Prompt</Label>
            <Textarea
              id="test-prompt"
              placeholder="Enter the prompt you want to test with different models..."
              value={config.testPrompt}
              onChange={(e) => setConfig(prev => ({ ...prev, testPrompt: e.target.value }))}
              rows={4}
            />
          </div>

          <Tabs defaultValue="models" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="criteria">Comparison Criteria</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Models</h3>
                <Button onClick={addModel} size="sm">
                  <IconPlus size={16} className="mr-1" />
                  Add Model
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.models.map((model, index) => (
                  <Card key={model.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">Model {String.fromCharCode(65 + index)}</Badge>
                      {config.models.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModel(model.id)}
                        >
                          <IconX size={16} />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={model.modelId}
                          onValueChange={(value) => {
                            const selectedModel = allModels.find(m => m.modelId === value)
                            updateModel(model.id, "modelId", value)
                            updateModel(model.id, "modelName", selectedModel?.modelName || "")
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allModels.map((m) => (
                              <SelectItem key={m.modelId} value={m.modelId}>
                                {m.modelName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <Input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={model.temperature}
                          onChange={(e) => updateModel(model.id, "temperature", parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Prompt (Optional)</Label>
                        <Input
                          placeholder="Override system prompt"
                          value={model.customPrompt || ""}
                          onChange={(e) => updateModel(model.id, "customPrompt", e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Comparison Criteria</h3>
                <Button onClick={addCriterion} size="sm">
                  <IconPlus size={16} className="mr-1" />
                  Add Criterion
                </Button>
              </div>
              
              <div className="space-y-3">
                {config.comparisonCriteria.map((criterion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g., accuracy, creativity, clarity"
                      value={criterion}
                      onChange={(e) => updateCriterion(index, e.target.value)}
                    />
                    {config.comparisonCriteria.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                      >
                        <IconX size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartTest}
              disabled={!config.name || !config.testPrompt || config.models.length < 2}
            >
              Start A/B Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
