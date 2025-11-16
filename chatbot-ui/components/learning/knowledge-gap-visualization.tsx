"use client"

import { FC, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KnowledgeTopic } from "@/types/learning"
import {
  IconCheck as CheckCircle,
  IconAlertCircle as AlertCircle,
  IconTrendingUp as TrendingUp,
  IconFilter as Filter,
  IconX as X,
  IconInfoCircle as InfoCircle
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface KnowledgeGapVisualizationProps {
  topics: KnowledgeTopic[]
  className?: string
}

export const KnowledgeGapVisualization: FC<KnowledgeGapVisualizationProps> = ({
  topics,
  className = ""
}) => {
  const [filter, setFilter] = useState<'all' | 'strength' | 'gap' | 'developing'>('all')
  const [sortBy, setSortBy] = useState<'confidence' | 'evidence' | 'recent'>('confidence')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Filter and sort topics
  const filteredAndSortedTopics = useMemo(() => {
    let filtered = topics || []
    
    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.mastery_level === filter)
    }
    
    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence
        case 'evidence':
          return b.evidence_count - a.evidence_count
        case 'recent':
          const aTime = a.last_mentioned ? new Date(a.last_mentioned).getTime() : 0
          const bTime = b.last_mentioned ? new Date(b.last_mentioned).getTime() : 0
          return bTime - aTime
        default:
          return 0
      }
    })
    
    return filtered
  }, [topics, filter, sortBy])

  // Group topics by mastery level
  const groupedTopics = useMemo(() => {
    const groups = {
      strength: filteredAndSortedTopics.filter(t => t.mastery_level === 'strength'),
      gap: filteredAndSortedTopics.filter(t => t.mastery_level === 'gap'),
      developing: filteredAndSortedTopics.filter(t => t.mastery_level === 'developing')
    }
    return groups
  }, [filteredAndSortedTopics])

  // Statistics
  const stats = useMemo(() => {
    const total = topics?.length || 0
    const strengths = topics?.filter(t => t.mastery_level === 'strength').length || 0
    const gaps = topics?.filter(t => t.mastery_level === 'gap').length || 0
    const developing = topics?.filter(t => t.mastery_level === 'developing').length || 0
    
    return {
      total,
      strengths,
      gaps,
      developing,
      strengthPercentage: total > 0 ? Math.round((strengths / total) * 100) : 0,
      gapPercentage: total > 0 ? Math.round((gaps / total) * 100) : 0,
      developingPercentage: total > 0 ? Math.round((developing / total) * 100) : 0
    }
  }, [topics])

  const getMasteryColor = (level: KnowledgeTopic['mastery_level']) => {
    switch (level) {
      case 'strength':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-800 border-green-300',
          icon: 'text-green-600',
          gradient: 'from-green-50 to-emerald-50'
        }
      case 'gap':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800 border-red-300',
          icon: 'text-red-600',
          gradient: 'from-red-50 to-rose-50'
        }
      case 'developing':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: 'text-yellow-600',
          gradient: 'from-yellow-50 to-amber-50'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: 'text-gray-600',
          gradient: 'from-gray-50 to-gray-100'
        }
    }
  }

  const getMasteryIcon = (level: KnowledgeTopic['mastery_level']) => {
    switch (level) {
      case 'strength':
        return <CheckCircle className="h-4 w-4" />
      case 'gap':
        return <AlertCircle className="h-4 w-4" />
      case 'developing':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <InfoCircle className="h-4 w-4" />
    }
  }

  const getMasteryLabel = (level: KnowledgeTopic['mastery_level']) => {
    switch (level) {
      case 'strength':
        return 'Strong Understanding'
      case 'gap':
        return 'Knowledge Gap'
      case 'developing':
        return 'Developing'
      default:
        return level
    }
  }

  if (!topics || topics.length === 0) {
    return (
      <Card className={`bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <InfoCircle className="h-4 w-4 text-gray-600" />
            </div>
            Knowledge Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <InfoCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No knowledge topics extracted yet.</p>
            <p className="text-xs mt-2 text-gray-400">
              Topics will appear here after analyzing your conversations.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <div className="p-1.5 bg-indigo-100 rounded-md">
              <InfoCircle className="h-4 w-4 text-indigo-600" />
            </div>
            Knowledge Topics Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="strength">Strengths</SelectItem>
                <SelectItem value="gap">Gaps</SelectItem>
                <SelectItem value="developing">Developing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">By Confidence</SelectItem>
                <SelectItem value="evidence">By Evidence</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/80 rounded-lg p-3 border border-indigo-200">
            <div className="text-xs text-gray-600 mb-1">Total Topics</div>
            <div className="text-2xl font-bold text-indigo-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 mb-1">Strengths</div>
            <div className="text-2xl font-bold text-green-900">{stats.strengths}</div>
            <div className="text-xs text-green-600 mt-1">{stats.strengthPercentage}%</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-xs text-red-700 mb-1">Knowledge Gaps</div>
            <div className="text-2xl font-bold text-red-900">{stats.gaps}</div>
            <div className="text-xs text-red-600 mt-1">{stats.gapPercentage}%</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-xs text-yellow-700 mb-1">Developing</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.developing}</div>
            <div className="text-xs text-yellow-600 mt-1">{stats.developingPercentage}%</div>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Topic Distribution</div>
          <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
            {stats.strengthPercentage > 0 && (
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${stats.strengthPercentage}%` }}
                title={`${stats.strengths} strengths`}
              >
                {stats.strengthPercentage > 10 && `${stats.strengthPercentage}%`}
              </div>
            )}
            {stats.gapPercentage > 0 && (
              <div
                className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${stats.gapPercentage}%` }}
                title={`${stats.gaps} gaps`}
              >
                {stats.gapPercentage > 10 && `${stats.gapPercentage}%`}
              </div>
            )}
            {stats.developingPercentage > 0 && (
              <div
                className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${stats.developingPercentage}%` }}
                title={`${stats.developing} developing`}
              >
                {stats.developingPercentage > 10 && `${stats.developingPercentage}%`}
              </div>
            )}
          </div>
        </div>

        {/* Topics List */}
        {filteredAndSortedTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No topics match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedTopics.map((topic, index) => {
              const colors = getMasteryColor(topic.mastery_level)
              const isExpanded = showDetails === topic.topic
              
              return (
                <div
                  key={`${topic.topic}-${index}`}
                  className={`bg-white rounded-lg border-2 ${colors.border} transition-all hover:shadow-md ${isExpanded ? 'shadow-lg' : ''}`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setShowDetails(isExpanded ? null : topic.topic)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={colors.icon}>
                            {getMasteryIcon(topic.mastery_level)}
                          </div>
                          <Badge className={colors.badge} variant="outline">
                            {getMasteryLabel(topic.mastery_level)}
                          </Badge>
                          <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                        </div>
                        
                        {!isExpanded && (
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>Confidence: {(topic.confidence * 100).toFixed(0)}%</span>
                            <span>Evidence: {topic.evidence_count} mentions</span>
                            {topic.last_mentioned && (
                              <span>
                                Last: {new Date(topic.last_mentioned).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDetails(isExpanded ? null : topic.topic)
                        }}
                      >
                        {isExpanded ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <InfoCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Confidence Level</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${topic.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {(topic.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Evidence Count</div>
                            <div className="text-lg font-bold text-gray-900">
                              {topic.evidence_count} {topic.evidence_count === 1 ? 'mention' : 'mentions'}
                            </div>
                          </div>
                        </div>
                        
                        {topic.last_mentioned && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Last Mentioned</div>
                            <div className="text-sm text-gray-700">
                              {new Date(topic.last_mentioned).toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {topic.related_topics && topic.related_topics.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">Related Topics</div>
                            <div className="flex flex-wrap gap-2">
                              {topic.related_topics
                                .filter((related): related is string => typeof related === 'string' && related.length > 0)
                                .map((related, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-gray-50"
                                  >
                                    {related}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Grouped View Toggle (Optional) */}
        {filter === 'all' && (
          <div className="mt-6 pt-6 border-t border-indigo-200">
            <div className="text-sm font-medium text-gray-700 mb-3">Grouped by Mastery Level</div>
            <div className="space-y-4">
              {/* Strengths Group */}
              {groupedTopics.strength.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h5 className="font-semibold text-green-900">
                      Strong Understanding ({groupedTopics.strength.length})
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedTopics.strength.slice(0, 10).map((topic, idx) => (
                      <Badge
                        key={idx}
                        className="bg-green-100 text-green-800 border-green-300"
                        variant="outline"
                      >
                        {topic.topic}
                      </Badge>
                    ))}
                    {groupedTopics.strength.length > 10 && (
                      <Badge variant="outline" className="text-gray-600">
                        +{groupedTopics.strength.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Gaps Group */}
              {groupedTopics.gap.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h5 className="font-semibold text-red-900">
                      Knowledge Gaps ({groupedTopics.gap.length})
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedTopics.gap.slice(0, 10).map((topic, idx) => (
                      <Badge
                        key={idx}
                        className="bg-red-100 text-red-800 border-red-300"
                        variant="outline"
                      >
                        {topic.topic}
                      </Badge>
                    ))}
                    {groupedTopics.gap.length > 10 && (
                      <Badge variant="outline" className="text-gray-600">
                        +{groupedTopics.gap.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Developing Group */}
              {groupedTopics.developing.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                    <h5 className="font-semibold text-yellow-900">
                      Developing ({groupedTopics.developing.length})
                    </h5>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedTopics.developing.slice(0, 10).map((topic, idx) => (
                      <Badge
                        key={idx}
                        className="bg-yellow-100 text-yellow-800 border-yellow-300"
                        variant="outline"
                      >
                        {topic.topic}
                      </Badge>
                    ))}
                    {groupedTopics.developing.length > 10 && (
                      <Badge variant="outline" className="text-gray-600">
                        +{groupedTopics.developing.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default KnowledgeGapVisualization
