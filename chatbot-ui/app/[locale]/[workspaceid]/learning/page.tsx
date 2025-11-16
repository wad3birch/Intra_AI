"use client"

import { FC, useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  IconArrowLeft as ArrowLeft,
  IconInfoCircle as Info,
  IconSchool as GraduationCap,
  IconMessageCircle as MessageCircle,
  IconTrendingUp as TrendingUp,
  IconCalendar as Calendar,
  IconClock as Clock
} from "@tabler/icons-react"
 
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { KnowledgeGapVisualization } from "@/components/learning/knowledge-gap-visualization"
 

 

const LearningPage: FC = () => {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params.workspaceid as string
  const locale = params.locale as string
 
  const [showInfo, setShowInfo] = useState(false)
  // Portrait state
  const [portrait, setPortrait] = useState<any | null>(null)
  const [portraitLoading, setPortraitLoading] = useState(false)
  const [portraitError, setPortraitError] = useState<string | null>(null)
  const [portraitSuccess, setPortraitSuccess] = useState<string | null>(null)
  
  // Timeline state
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [timelineSummary, setTimelineSummary] = useState<any>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Check if user has no usage data
  const hasNoUsageData = () => {
    if (!portrait?.usage_metrics) return true
    return portrait.usage_metrics.total_messages_30d === 0 || 
           portrait.usage_metrics.total_messages_30d === null ||
           portrait.usage_metrics.total_messages_30d === undefined
  }

  useEffect(() => {
    // load existing portrait if any
    ;(async () => {
      try {
        const res = await fetch('/api/learning-portrait')
        if (res.ok) {
          const data = await res.json()
          if (data?.portrait) setPortrait(data.portrait)
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  // Load real timeline data from API
  const loadTimelineData = async (timeRange: '7d' | '30d' | '90d') => {
    try {
      setTimelineLoading(true)
      
      const response = await fetch(`/api/learning-timeline?range=${timeRange}`)
      const data = await response.json()
      
      if (data.error) {
        setTimelineData([])
        setTimelineSummary(null)
      } else {
        setTimelineData(data.timeline || [])
        setTimelineSummary(data.summary || null)
      }
    } catch (error) {
      setTimelineData([])
      setTimelineSummary(null)
    } finally {
      setTimelineLoading(false)
    }
  }

  // Load timeline data when time range changes
  useEffect(() => {
    if (portrait) {
      loadTimelineData(selectedTimeRange)
    }
  }, [selectedTimeRange, portrait])

  const generatePortrait = async () => {
    try {
      setPortraitLoading(true)
      setPortraitError(null)
      setPortraitSuccess(null)
      const res = await fetch('/api/learning-portrait/generate', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to generate portrait`)
      }
      const data = await res.json()
      setPortrait(data.portrait)
      setPortraitSuccess('Portrait generated successfully!')
      setTimeout(() => setPortraitSuccess(null), 3000)
    } catch (e: any) {
      setPortraitError(e?.message || 'Failed to generate portrait')
    } finally {
      setPortraitLoading(false)
    }
  }

  const deletePortrait = async () => {
    try {
      setPortraitLoading(true)
      setPortraitError(null)
      setPortraitSuccess(null)
      const res = await fetch('/api/learning-portrait', { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `Failed to delete portrait`)
      }
      setPortrait(null)
      setPortraitSuccess('Portrait deleted successfully!')
      setTimeout(() => setPortraitSuccess(null), 3000)
    } catch (e: any) {
      setPortraitError(e?.message || 'Failed to delete portrait')
    } finally {
      setPortraitLoading(false)
    }
  }

  // Export current portrait sections to a printable HTML, then trigger Save as PDF
  const exportPortraitToPDF = async () => {
    try {
      if (!portrait) return

      // Parse portrait summary JSON
      const parsePortraitJSON = (jsonString: string) => {
        try {
          return JSON.parse(jsonString)
        } catch (error) {
          try {
            let cleaned = jsonString
              .replace(/^```json\s*/, '')
              .replace(/\s*```$/, '')
              .trim()
            return JSON.parse(cleaned)
          } catch (secondError) {
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0])
              } catch (thirdError) {
                return null
              }
            }
            return null
          }
        }
      }

      const parsedSummary = parsePortraitJSON(portrait.summary || '{}')
      
      // Get timeline data for the selected time range
      let timelineDataForPDF = []
      let timelineSummaryForPDF = null
      try {
        const timelineRes = await fetch(`/api/learning-timeline?range=${selectedTimeRange}`)
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json()
          timelineDataForPDF = timelineData.timeline || []
          timelineSummaryForPDF = timelineData.summary || null
        }
      } catch (e) {
        console.warn('Failed to fetch timeline for PDF:', e)
      }

      // Extract data for PDF
      const usageMetrics = portrait.usage_metrics || {}
      const learningPatterns = portrait.learning_patterns || {}
      
      // Calculate metrics
      const learningDepth = usageMetrics.avg_messages_per_session > 10 ? 'Deep' : 
                           usageMetrics.avg_messages_per_session > 5 ? 'Moderate' : 'Quick'
      const consistency = usageMetrics.sessions_30d > 20 ? 'High' : 
                         usageMetrics.sessions_30d > 10 ? 'Medium' : 'Low'
      const learningStyle = parsedSummary?.preferred_style || portrait.preferred_style || 'Adaptive'
      const skillLevel = usageMetrics.avg_messages_per_session > 15 ? 'Advanced' : 
                        usageMetrics.avg_messages_per_session > 8 ? 'Intermediate' : 'Beginner'

      // Extract arrays safely
      const strengths = Array.isArray(parsedSummary?.strengths) ? parsedSummary.strengths : 
                       parsedSummary?.strengths ? [parsedSummary.strengths] : 
                       portrait.strengths ? [portrait.strengths] : []
      const challenges = Array.isArray(parsedSummary?.challenges) ? parsedSummary.challenges : 
                        parsedSummary?.challenges ? [parsedSummary.challenges] : 
                        portrait.challenges ? [portrait.challenges] : []
      const recommendations = Array.isArray(parsedSummary?.recommendations) ? parsedSummary.recommendations : 
                            parsedSummary?.recommendations ? [parsedSummary.recommendations] : 
                            portrait.recommendations ? [portrait.recommendations] : []
      const nextQuestions = Array.isArray(parsedSummary?.next_questions) ? parsedSummary.next_questions : 
                           Array.isArray(portrait.next_questions) ? portrait.next_questions : 
                           portrait.next_questions ? [portrait.next_questions] : []

      const summaryText = parsedSummary?.summary || portrait.summary || 'No summary available'
      const pacing = parsedSummary?.pacing || portrait.pacing || 'Not specified'

      // Extract knowledge topics
      const knowledgeTopics = portrait.knowledge_topics || []
      const topicsByLevel = {
        strength: knowledgeTopics.filter((t: any) => t.mastery_level === 'strength'),
        gap: knowledgeTopics.filter((t: any) => t.mastery_level === 'gap'),
        developing: knowledgeTopics.filter((t: any) => t.mastery_level === 'developing')
      }

      const title = 'Learning Portrait'
      const exportedAt = new Date().toLocaleString()

      // Calculate timeline chart data
      const maxMessages = timelineDataForPDF.length > 0 ? 
        Math.max(...timelineDataForPDF.map((d: any) => d.messages || 0), 1) : 1
      const totalMessages = timelineDataForPDF.reduce((sum: number, day: any) => sum + (day.messages || 0), 0)
      const avgDaily = timelineDataForPDF.length > 0 ? Math.round(totalMessages / timelineDataForPDF.length) : 0
      const peakDay = timelineDataForPDF.length > 0 ? 
        timelineDataForPDF.reduce((max: any, day: any) => (day.messages || 0) > (max.messages || 0) ? day : max, timelineDataForPDF[0]) : null

      // Helper function to escape HTML and format text
      const escapeHtml = (text: string) => {
        if (!text) return ''
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
      }

      const formatSummaryText = (text: string) => {
        if (!text) return '<p>No summary available</p>'
        // Split by newlines and wrap in paragraphs
        const paragraphs = text.split(/\n+/).filter(p => p.trim())
        return paragraphs.length > 0 
          ? paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('')
          : `<p>${escapeHtml(text.trim())}</p>`
      }

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --blue-50: #eff6ff;
      --blue-100: #dbeafe;
      --blue-500: #3b82f6;
      --blue-600: #2563eb;
      --blue-700: #1d4ed8;
      --blue-800: #1e40af;
      --blue-900: #1e3a8a;
      --indigo-50: #eef2ff;
      --indigo-100: #e0e7ff;
      --indigo-500: #6366f1;
      --indigo-600: #4f46e5;
      --indigo-800: #3730a3;
      --green-50: #f0fdf4;
      --green-100: #dcfce7;
      --green-500: #22c55e;
      --green-600: #16a34a;
      --green-800: #166534;
      --green-900: #14532d;
      --purple-50: #faf5ff;
      --purple-100: #f3e8ff;
      --purple-500: #a78bfa;
      --purple-600: #9333ea;
      --orange-50: #fff7ed;
      --orange-100: #ffedd5;
      --orange-500: #f97316;
      --orange-600: #ea580c;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
    }

    @page {
      size: landscape;
      margin: 15mm 10mm 10mm 10mm;
    }

    @media print {
      body { margin: 0; }
      .no-print { display: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--gray-900);
      background: var(--gray-50);
      font-size: 13px;
      line-height: 1.5;
    }

    .poster-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: white;
      padding: 20px;
      gap: 16px;
    }

    /* Header Zone */
    .header-zone {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(90deg, var(--blue-100), var(--purple-100), var(--green-100));
      border-radius: 12px;
      border: 1px solid var(--gray-200);
      margin-bottom: 8px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--blue-600), var(--indigo-600));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .header-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--gray-900);
      letter-spacing: -0.02em;
    }

    .header-right {
      font-size: 13px;
      color: var(--gray-700);
    }

    /* Quick Metrics Zone */
    .metrics-zone {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 8px;
    }

    .metric-card {
      background: linear-gradient(135deg, var(--blue-50), var(--blue-100));
      border: 1px solid var(--blue-200);
      border-radius: 10px;
      padding: 14px;
      text-align: center;
    }

    .metric-card:nth-child(1) { background: linear-gradient(135deg, var(--blue-50), var(--blue-100)); border-color: var(--blue-300); }
    .metric-card:nth-child(2) { background: linear-gradient(135deg, var(--green-50), var(--green-100)); border-color: var(--green-300); }
    .metric-card:nth-child(3) { background: linear-gradient(135deg, var(--purple-50), var(--purple-100)); border-color: var(--purple-300); }
    .metric-card:nth-child(4) { background: linear-gradient(135deg, var(--orange-50), var(--orange-100)); border-color: var(--orange-300); }

    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 4px;
    }

    .metric-sublabel {
      font-size: 10px;
      color: var(--gray-600);
    }

    /* Executive Summary Zone */
    .summary-zone {
      background: linear-gradient(135deg, var(--indigo-50), var(--blue-50));
      border: 1px solid var(--indigo-200);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--indigo-900);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title::before {
      content: "";
      width: 6px;
      height: 6px;
      background: var(--indigo-600);
      border-radius: 50%;
      display: inline-block;
    }

    .summary-content {
      color: var(--gray-800);
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .summary-content strong {
      font-weight: 700;
      color: var(--gray-900);
      font-size: 15px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 16px;
    }

    .summary-item {
      background: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid var(--gray-200);
    }

    .summary-item-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-600);
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .summary-item-value {
      font-size: 13px;
      color: var(--gray-900);
      line-height: 1.5;
    }

    .tag {
      display: inline-block;
      padding: 4px 10px;
      background: var(--green-100);
      color: var(--green-800);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }

    /* Two Column Zone - Patterns & Timeline */
    .two-col-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 8px;
    }

    .patterns-zone {
      background: linear-gradient(135deg, var(--green-50), var(--green-100));
      border: 1px solid var(--green-200);
      border-radius: 12px;
      padding: 18px;
    }

    .patterns-zone .section-title {
      color: var(--green-900);
    }

    .patterns-zone .section-title::before {
      background: var(--green-600);
    }

    .patterns-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .pattern-card {
      background: white;
      border: 1px solid var(--green-200);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }

    .pattern-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--green-800);
      margin-bottom: 6px;
    }

    .pattern-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--green-900);
      margin-bottom: 4px;
    }

    .pattern-sublabel {
      font-size: 9px;
      color: var(--gray-600);
    }

    .timeline-zone {
      background: linear-gradient(135deg, var(--indigo-50), var(--purple-50));
      border: 1px solid var(--indigo-200);
      border-radius: 12px;
      padding: 18px;
    }

    .timeline-zone .section-title {
      color: var(--indigo-900);
    }

    .timeline-zone .section-title::before {
      background: var(--indigo-600);
    }

    .timeline-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }

    .timeline-stat {
      background: white;
      border: 1px solid var(--indigo-200);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }

    .timeline-stat-label {
      font-size: 9px;
      color: var(--gray-600);
      margin-bottom: 4px;
    }

    .timeline-stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--indigo-900);
    }

    .timeline-chart {
      background: white;
      border: 1px solid var(--indigo-200);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 14px;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 80px;
      gap: 4px;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, var(--indigo-500), var(--indigo-600));
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      position: relative;
    }

    .chart-bar.weekend {
      background: linear-gradient(to top, var(--indigo-300), var(--indigo-400));
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 9px;
      color: var(--gray-600);
    }

    /* Recommendations Zone */
    .recommendations-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 8px;
    }

    .recommendations-box {
      background: linear-gradient(135deg, var(--indigo-50), var(--blue-50));
      border: 1px solid var(--indigo-200);
      border-radius: 12px;
      padding: 18px;
    }

    .recommendations-box .section-title {
      color: var(--indigo-900);
      margin-bottom: 12px;
    }

    .recommendations-box .section-title::before {
      background: var(--indigo-600);
    }

    .questions-box {
      background: linear-gradient(135deg, var(--purple-50), var(--pink-50));
      border: 1px solid var(--purple-200);
      border-radius: 12px;
      padding: 18px;
    }

    .questions-box .section-title {
      color: var(--purple-900);
      margin-bottom: 12px;
    }

    .questions-box .section-title::before {
      background: var(--purple-600);
    }

    .list-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--gray-800);
    }

    .list-item::before {
      content: "•";
      color: var(--indigo-600);
      font-weight: bold;
      font-size: 16px;
      margin-top: -2px;
    }

    .questions-box .list-item::before {
      color: var(--purple-600);
    }

    .list-item:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="poster-container">
    <!-- Header Zone -->
    <div class="header-zone">
      <div class="header-left">
        <div class="header-icon">🎓</div>
        <div class="header-title">Learning Portrait</div>
      </div>
      <div class="header-right">Generated: ${exportedAt}</div>
    </div>

    <!-- Quick Metrics Zone -->
    <div class="metrics-zone">
      <div class="metric-card">
        <div class="metric-label">Learning Depth</div>
        <div class="metric-value">${escapeHtml(learningDepth)}</div>
        <div class="metric-sublabel">Session Style</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Consistency</div>
        <div class="metric-value">${escapeHtml(consistency)}</div>
        <div class="metric-sublabel">Learning Frequency</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Learning Style</div>
        <div class="metric-value">${escapeHtml(learningStyle.replace(/-/g, ' '))}</div>
        <div class="metric-sublabel">Approach Type</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Skill Level</div>
        <div class="metric-value">${escapeHtml(skillLevel)}</div>
        <div class="metric-sublabel">Current Level</div>
      </div>
    </div>

    <!-- Executive Summary Zone -->
    <div class="summary-zone">
      <div class="section-title">Executive Summary</div>
      <div class="summary-content">${formatSummaryText(summaryText)}</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-item-label">Preferred Style</div>
          <div class="summary-item-value"><span class="tag">${escapeHtml(learningStyle.replace(/-/g, ' '))}</span></div>
    </div>
        <div class="summary-item">
          <div class="summary-item-label">Learning Pace</div>
          <div class="summary-item-value">${escapeHtml(pacing)}</div>
        </div>
      </div>
      ${strengths.length > 0 ? `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 600; color: var(--purple-800); margin-bottom: 8px;">Key Strengths</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${strengths.map((s: string) => `<span class="tag" style="background: var(--purple-100); color: var(--purple-800);">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      ${challenges.length > 0 ? `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 600; color: var(--orange-800); margin-bottom: 8px;">Areas for Growth</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${challenges.map((c: string) => `<span class="tag" style="background: var(--orange-100); color: var(--orange-800);">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
      ` : ''}
  </div>

    <!-- Two Column Zone: Patterns & Timeline -->
    <div class="two-col-zone">
      <!-- Learning Patterns -->
      <div class="patterns-zone">
        <div class="section-title">Learning Patterns</div>
        <div class="patterns-grid">
          <div class="pattern-card">
            <div class="pattern-label">Example Requests</div>
            <div class="pattern-value">${learningPatterns.exampleRequests ?? '—'}</div>
            <div class="pattern-sublabel">Requests for examples</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-label">Explanation Requests</div>
            <div class="pattern-value">${learningPatterns.explanationRequests ?? '—'}</div>
            <div class="pattern-sublabel">Requests for explanations</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-label">Code Requests</div>
            <div class="pattern-value">${learningPatterns.codeRequests ?? '—'}</div>
            <div class="pattern-sublabel">Requests for code</div>
          </div>
          <div class="pattern-card">
            <div class="pattern-label">Comparison Requests</div>
            <div class="pattern-value">${learningPatterns.comparisonRequests ?? '—'}</div>
            <div class="pattern-sublabel">Requests for comparisons</div>
          </div>
        </div>
      </div>

      <!-- Learning Timeline -->
      <div class="timeline-zone">
        <div class="section-title">Learning Timeline (${selectedTimeRange})</div>
        ${timelineDataForPDF.length > 0 ? `
        <div class="timeline-stats">
          <div class="timeline-stat">
            <div class="timeline-stat-label">Total Messages</div>
            <div class="timeline-stat-value">${totalMessages}</div>
          </div>
          <div class="timeline-stat">
            <div class="timeline-stat-label">Avg Daily</div>
            <div class="timeline-stat-value">${avgDaily}</div>
          </div>
          <div class="timeline-stat">
            <div class="timeline-stat-label">Peak Day</div>
            <div class="timeline-stat-value">${peakDay?.messages || 0}</div>
          </div>
        </div>
        <div class="timeline-chart">
          <div class="chart-bars">
            ${timelineDataForPDF.map((day: any) => {
              const height = maxMessages > 0 ? Math.max((day.messages || 0) / maxMessages * 100, day.messages > 0 ? 15 : 0) : 0
              const isWeekend = day.isWeekend || false
              return `<div class="chart-bar ${isWeekend ? 'weekend' : ''}" style="height: ${height}%"></div>`
            }).join('')}
          </div>
          <div class="chart-labels">
            ${timelineDataForPDF.map((day: any) => `<span>${escapeHtml(day.dayName || day.date?.substring(5) || '')}</span>`).join('')}
          </div>
        </div>
        ` : '<div style="text-align: center; color: var(--gray-600); padding: 20px;">No timeline data available</div>'}
      </div>
    </div>

    ${knowledgeTopics.length > 0 ? `
    <!-- Knowledge Topics Zone -->
    <div class="knowledge-topics-zone" style="background: linear-gradient(135deg, var(--indigo-50), var(--purple-50)); border: 1px solid var(--indigo-200); border-radius: 12px; padding: 18px; margin-bottom: 8px;">
      <div class="section-title" style="color: var(--indigo-900);">Knowledge Topics Map</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px;">
        <div style="background: white; border: 1px solid var(--green-200); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--gray-600); margin-bottom: 4px;">Strengths</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--green-900);">${topicsByLevel.strength.length}</div>
        </div>
        <div style="background: white; border: 1px solid var(--red-200); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--gray-600); margin-bottom: 4px;">Knowledge Gaps</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--red-900);">${topicsByLevel.gap.length}</div>
        </div>
        <div style="background: white; border: 1px solid var(--yellow-200); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--gray-600); margin-bottom: 4px;">Developing</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--yellow-900);">${topicsByLevel.developing.length}</div>
        </div>
      </div>
      ${topicsByLevel.gap.length > 0 ? `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--red-900); margin-bottom: 8px;">⚠️ Knowledge Gaps (Priority Focus Areas)</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${topicsByLevel.gap.slice(0, 12).map((topic: any) => 
            `<span style="display: inline-block; padding: 4px 10px; background: var(--red-100); color: var(--red-800); border-radius: 6px; font-size: 10px; font-weight: 600;">${escapeHtml(topic.topic)}</span>`
          ).join('')}
          ${topicsByLevel.gap.length > 12 ? `<span style="display: inline-block; padding: 4px 10px; background: var(--gray-100); color: var(--gray-600); border-radius: 6px; font-size: 10px;">+${topicsByLevel.gap.length - 12} more</span>` : ''}
        </div>
      </div>
      ` : ''}
      ${topicsByLevel.strength.length > 0 ? `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 600; color: var(--green-900); margin-bottom: 8px;">✓ Strong Understanding</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${topicsByLevel.strength.slice(0, 10).map((topic: any) => 
            `<span style="display: inline-block; padding: 4px 10px; background: var(--green-100); color: var(--green-800); border-radius: 6px; font-size: 10px; font-weight: 600;">${escapeHtml(topic.topic)}</span>`
          ).join('')}
          ${topicsByLevel.strength.length > 10 ? `<span style="display: inline-block; padding: 4px 10px; background: var(--gray-100); color: var(--gray-600); border-radius: 6px; font-size: 10px;">+${topicsByLevel.strength.length - 10} more</span>` : ''}
        </div>
      </div>
      ` : ''}
      ${topicsByLevel.developing.length > 0 ? `
      <div>
        <div style="font-size: 12px; font-weight: 600; color: var(--yellow-900); margin-bottom: 8px;">📈 Developing</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${topicsByLevel.developing.slice(0, 10).map((topic: any) => 
            `<span style="display: inline-block; padding: 4px 10px; background: var(--yellow-100); color: var(--yellow-800); border-radius: 6px; font-size: 10px; font-weight: 600;">${escapeHtml(topic.topic)}</span>`
          ).join('')}
          ${topicsByLevel.developing.length > 10 ? `<span style="display: inline-block; padding: 4px 10px; background: var(--gray-100); color: var(--gray-600); border-radius: 6px; font-size: 10px;">+${topicsByLevel.developing.length - 10} more</span>` : ''}
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Recommendations Zone -->
    <div class="recommendations-zone">
      <div class="recommendations-box">
        <div class="section-title">Recommendations</div>
        ${recommendations.length > 0 ? 
          recommendations.map((r: string) => `<div class="list-item">${escapeHtml(r)}</div>`).join('') : 
          '<div style="color: var(--gray-600); font-size: 12px;">No recommendations available</div>'
        }
      </div>
      <div class="questions-box">
        <div class="section-title">Suggested Next Questions</div>
        ${nextQuestions.length > 0 ? 
          nextQuestions.map((q: string) => `<div class="list-item">"${escapeHtml(q)}"</div>`).join('') : 
          '<div style="color: var(--gray-600); font-size: 12px;">No questions available</div>'
        }
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 150);
    }
  </script>
</body>
</html>`

      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    } catch (e) {
      console.error('Failed to export PDF:', e)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-2">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Learning Portrait</h1>
                <p className="text-sm text-gray-500">Your AI-derived learning profile</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="How Learning Portrait Works"
              title="How Learning Portrait Works"
              className="inline-flex items-center justify-center rounded-full border bg-white/90 p-2 text-gray-600 shadow-sm hover:bg-white"
              onClick={() => setShowInfo(true)}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">Your Learning Portrait</div>
                <div className="text-sm text-gray-500">Generated from your chats, preferences, and interests</div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  id="btn-generate-portrait" 
                  onClick={generatePortrait} 
                  disabled={portraitLoading} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-700 hover:to-indigo-700"
                >
                  {portraitLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Analyzing Your Data...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      {portrait ? 'Refresh Portrait' : 'Generate Portrait'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  disabled={!portrait || portraitLoading} 
                  className={!portrait ? 'opacity-60 cursor-not-allowed' : ''}
                  onClick={exportPortraitToPDF}
                >
                  Export PDF
                </Button>
                {portrait && (
                  <Button 
                    variant="outline" 
                    onClick={deletePortrait}
                    disabled={portraitLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete Portrait
                  </Button>
                )}
              </div>
                </div>
            {!portrait ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-3 rounded-full bg-blue-50 p-3 text-blue-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="text-lg font-medium text-gray-900">No portrait yet</div>
                <div className="mt-1 max-w-md text-center text-sm text-gray-500">Click Generate to create your personalized learning portrait based on your recent usage.</div>
                <div className="mt-4">
                  <Button onClick={generatePortrait} disabled={portraitLoading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow">
                    {portraitLoading ? 'Generating...' : 'Generate Now'}
                  </Button>
                  </div>
                </div>
            ) : hasNoUsageData() ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-3 rounded-full bg-blue-50 p-3 text-blue-600">
                  <GraduationCap className="h-6 w-6" />
              </div>
                <div className="text-lg font-medium text-gray-900">No learning activity detected</div>
                <div className="mt-1 max-w-md text-center text-sm text-gray-500">
                  You haven't used our learning features in the past 30 days. 
                  Start exploring to build your learning portrait!
                        </div>
                <div className="mt-6 space-y-3 flex flex-col items-center">
                  <Button 
                    onClick={() => router.push(`/${locale}/${workspaceId}/learning-companion`)} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow w-full max-w-xs"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Learning Conversation
                  </Button>
                  <div className="text-xs text-gray-500 text-center">
                    Try asking questions, requesting explanations, or exploring topics
                        </div>
                      </div>
              </div>
            ) : (
            <>
            {/* Learning Timeline - Moved to top */}
            <div className="mt-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-indigo-800 text-lg">
                      <div className="p-1.5 bg-indigo-100 rounded-md">
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                      </div>
                      Learning Timeline
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg bg-indigo-100 p-1">
                        {(['7d', '30d', '90d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setSelectedTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              selectedTimeRange === range
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-indigo-600 hover:text-indigo-700'
                            }`}
                          >
                            {range}
                        </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {timelineLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading timeline data...
                      </div>
                    </div>
                  ) : timelineData.length > 0 ? (
                    <div className="space-y-4">
                      {/* Timeline Chart */}
                      <div className="bg-white rounded-lg p-4 border border-indigo-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Daily Learning Activity</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                              Messages
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Sessions
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Bar Chart with better height calculation */}
                        <div className="flex items-end justify-between h-40 gap-1">
                          {timelineData.map((day, index) => {
                            const maxMessages = Math.max(...timelineData.map(d => d.messages), 1)
                            const calculatedHeight = maxMessages > 0 ? (day.messages / maxMessages) * 100 : 0
                            // Ensure minimum height for visibility when there are messages
                            const height = Math.max(calculatedHeight, day.messages > 0 ? 15 : 0)
                            const isToday = index === timelineData.length - 1
                            
                            return (
                              <div key={day.date} className="flex flex-col items-center flex-1 group">
                                <div className="relative w-full">
                                  <div
                                    className={`w-full rounded-t transition-all duration-300 group-hover:opacity-80 ${
                                      day.isWeekend 
                                        ? 'bg-gradient-to-t from-indigo-300 to-indigo-400' 
                                        : 'bg-gradient-to-t from-indigo-500 to-indigo-600'
                                    }`}
                                    style={{ 
                                      height: `${height}%`,
                                      minHeight: day.messages > 0 ? '6px' : '0px'
                                    }}
                                  ></div>
                                  {isToday && (
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  {day.dayName}
                                </div>
                                <div className="text-xs font-medium text-gray-900 mt-1">
                                  {day.messages}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Timeline Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-700">Total Messages</span>
                    </div>
                          <div className="text-2xl font-bold text-indigo-900">
                            {timelineSummary?.totalMessages || timelineData.reduce((sum, day) => sum + day.messages, 0)}
                  </div>
                          <div className="text-xs text-gray-500">
                            {selectedTimeRange} period
                </div>
              </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Avg Daily</span>
            </div>
                          <div className="text-2xl font-bold text-green-900">
                            {timelineSummary?.avgDailyMessages || Math.round(timelineData.reduce((sum, day) => sum + day.messages, 0) / timelineData.length)}
                    </div>
                          <div className="text-xs text-gray-500">
                            messages per day
                    </div>
                  </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-indigo-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Peak Day</span>
                        </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {timelineSummary?.peakDay?.messages || Math.max(...timelineData.map(d => d.messages))}
                      </div>
                          <div className="text-xs text-gray-500">
                            {timelineSummary?.peakDay?.dayName || 'highest activity'}
                          </div>
                        </div>
                    </div>

                      {/* Recent Activity Details */}
                      <div className="bg-white rounded-lg p-4 border border-indigo-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Recent Learning Patterns</h4>
                        <div className="space-y-2">
                          {timelineData.slice(-7).map((day, index) => (
                            <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-gray-700 w-12">
                                  {day.dayName}
                        </div>
                                <div className="text-sm text-gray-600">
                                  {day.messages} messages, {day.sessions} sessions
                      </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{day.patterns.exampleRequests} examples</span>
                                <span>{day.patterns.explanationRequests} explanations</span>
                                <span>{day.patterns.codeRequests} code requests</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No timeline data available</p>
                      <div className="mt-4 text-sm text-gray-400">
                        <p>This could mean:</p>
                        <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
                          <li>• No chat sessions in the selected time range</li>
                          <li>• No messages in the selected time range</li>
                          <li>• Data format issues in the database</li>
                        </ul>
                        <p className="mt-4 text-xs">
                          Check the browser console for debug information.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                    </div>

            {/* Enhanced Key metrics overview - Focused on learning patterns */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Learning Depth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900" id="portrait-metrics-depth">
                    {portrait?.usage_metrics?.avg_messages_per_session > 10 ? 'Deep' : 
                     portrait?.usage_metrics?.avg_messages_per_session > 5 ? 'Moderate' : 'Quick'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Session style</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Consistency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900" id="portrait-metrics-consistency">
                    {portrait?.usage_metrics?.sessions_30d > 20 ? 'High' : 
                     portrait?.usage_metrics?.sessions_30d > 10 ? 'Medium' : 'Low'}
                </div>
                  <div className="text-xs text-green-600 mt-1">Learning frequency</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Learning Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900" id="portrait-metrics-style">
                    {portrait?.learning_style?.preferred_approach ?? 'Adaptive'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Approach type</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Skill Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900" id="portrait-metrics-skilllevel">
                    {portrait?.learning_style?.educational_level ?? 'Intermediate'}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">Current level</div>
                </CardContent>
              </Card>
              </div>

            {/* Data Insights */}
            {portrait?.usage_metrics && portrait.usage_metrics.total_messages_30d > 0 ? (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-md bg-gradient-to-r from-green-500 to-emerald-600 p-1.5">
                        <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                      Data Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Learning Engagement</div>
                        <div className="text-sm text-gray-600">
                          {portrait.usage_metrics.total_messages_30d > 20 ? 'High' : 
                           portrait.usage_metrics.total_messages_30d > 10 ? 'Medium' : 'Low'} engagement
                </div>
                  </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Session Depth</div>
                        <div className="text-sm text-gray-600">
                          {portrait.usage_metrics.avg_messages_per_session > 10 ? 'Deep' : 
                           portrait.usage_metrics.avg_messages_per_session > 5 ? 'Moderate' : 'Quick'} sessions
                  </div>
                </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900">Learning Style</div>
                        <div className="text-sm text-gray-600">
                          {portrait.learning_patterns?.exampleRequests > 5 ? 'Example-driven' :
                           portrait.learning_patterns?.explanationRequests > 5 ? 'Concept-focused' :
                           portrait.learning_patterns?.codeRequests > 5 ? 'Code-oriented' : 'Balanced'} learner
              </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  </div>
            ) : portrait?.usage_metrics ? (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="rounded-md bg-gradient-to-r from-gray-400 to-gray-500 p-1.5">
                        <GraduationCap className="h-4 w-4 text-white" />
                      </div>
                      Ready to Start Learning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">
                        Your learning insights will appear here once you start using our features
                      </div>
                    <Button
                        onClick={() => router.push('/learning-companion')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Begin Your Learning Journey
                    </Button>
                  </div>
                  </CardContent>
                </Card>
                </div>
            ) : null}

            {/* Enhanced Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Summary Card - Full width and enhanced */}
              <Card className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-indigo-900">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
              </div>
                    Learning Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portraitError && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {portraitError}
                      </div>
                          </div>
                  )}
                  {portraitSuccess && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {portraitSuccess}
                      </div>
                    </div>
                    )}
                  <div className="text-base text-gray-800 leading-relaxed" id="portrait-summary">
                    {(() => {
                      if (!portrait?.summary) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">📚</div>
                            <p>No portrait yet. Click Generate to create your personalized learning profile.</p>
                          </div>
                        )
                      }
                      
                      // 改进的 JSON 解析函数
                      const parsePortraitJSON = (jsonString: string) => {
                        try {
                          // 首先尝试直接解析
                          return JSON.parse(jsonString)
                        } catch (error) {
                          // 如果失败，尝试清理和修复常见的 JSON 问题
                          try {
                            // 移除可能的 markdown 代码块标记
                            let cleaned = jsonString
                              .replace(/^```json\s*/, '')
                              .replace(/\s*```$/, '')
                              .trim()
                            
                            // 尝试解析清理后的内容
                            return JSON.parse(cleaned)
                          } catch (secondError) {
                            // 如果还是失败，尝试提取 JSON 对象
                            const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
                            if (jsonMatch) {
                              try {
                                return JSON.parse(jsonMatch[0])
                              } catch (thirdError) {
                                console.warn('Failed to parse portrait JSON:', thirdError)
                                return null
                              }
                            }
                            return null
                          }
                        }
                      }
                      
                      const parsedSummary = parsePortraitJSON(portrait.summary)
                      
                      // 如果解析成功，显示格式化的内容
                      if (parsedSummary && typeof parsedSummary === 'object' && parsedSummary !== null) {
                        return (
                          <div className="space-y-4">
                            {/* Summary Section */}
                            {parsedSummary.summary && (
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <h4 className="font-semibold text-blue-900">Learning Summary</h4>
              </div>
                                <p className="text-blue-800 leading-relaxed">{parsedSummary.summary}</p>
            </div>
          )}
                            
                            {/* Preferred Style */}
                            {parsedSummary.preferred_style && (
                              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <h4 className="font-semibold text-green-900">Preferred Learning Style</h4>
                                </div>
                                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                                  {parsedSummary.preferred_style.replace('-', ' ')}
                                </div>
                              </div>
                            )}
                            
                            {/* Strengths */}
                            {parsedSummary.strengths && Array.isArray(parsedSummary.strengths) && parsedSummary.strengths.length > 0 && (
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <h4 className="font-semibold text-purple-900">Learning Strengths</h4>
              </div>
                                <ul className="space-y-2">
                                  {parsedSummary.strengths.map((strength: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-purple-800">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Challenges */}
                            {parsedSummary.challenges && Array.isArray(parsedSummary.challenges) && parsedSummary.challenges.length > 0 && (
                              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <h4 className="font-semibold text-orange-900">Areas for Growth</h4>
            </div>
                                <ul className="space-y-2">
                                  {parsedSummary.challenges.map((challenge: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-orange-800">{challenge}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Pacing */}
                            {parsedSummary.pacing && (
                              <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border border-cyan-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                                  <h4 className="font-semibold text-cyan-900">Learning Pace</h4>
                                </div>
                                <p className="text-cyan-800">{parsedSummary.pacing}</p>
                              </div>
                            )}
                            
                            {/* Recommendations */}
                            {parsedSummary.recommendations && Array.isArray(parsedSummary.recommendations) && parsedSummary.recommendations.length > 0 && (
                              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                  <h4 className="font-semibold text-indigo-900">Recommendations</h4>
            </div>
                                <ul className="space-y-2">
                                  {parsedSummary.recommendations.map((recommendation: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-indigo-800">{recommendation}</span>
                                    </li>
                                  ))}
                                </ul>
          </div>
                            )}
                            
                            {/* Next Questions */}
                            {parsedSummary.next_questions && Array.isArray(parsedSummary.next_questions) && parsedSummary.next_questions.length > 0 && (
                              <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                  <h4 className="font-semibold text-pink-900">Suggested Next Questions</h4>
            </div>
                                <ul className="space-y-2">
                                  {parsedSummary.next_questions.map((question: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-pink-800 italic">"{question}"</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      // 如果解析失败，显示原始内容和错误提示
                      return (
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <h4 className="font-semibold text-yellow-900">Raw Portrait Data</h4>
                            </div>
                            <p className="text-yellow-800 text-sm mb-2">Unable to parse structured data. Showing raw content:</p>
                            <div className="bg-white p-3 rounded border text-sm text-gray-700 font-mono whitespace-pre-wrap">
                              {portrait.summary}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
              </CardContent>
            </Card>

              {/* Learning Patterns - 保留这个独立的数据，因为 JSON 解析中可能不包含 */}
              <Card className="md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
                    <div className="p-1.5 bg-green-100 rounded-md">
                      <GraduationCap className="h-4 w-4 text-green-600" />
            </div>
                    Learning Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="portrait-patterns">
                    <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Example Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{portrait?.learning_patterns?.exampleRequests ?? '—'}</div>
                      <div className="text-xs text-green-600 mt-1">Requests for examples</div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Explanation Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{portrait?.learning_patterns?.explanationRequests ?? '—'}</div>
                      <div className="text-xs text-green-600 mt-1">Requests for explanations</div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Code Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{portrait?.learning_patterns?.codeRequests ?? '—'}</div>
                      <div className="text-xs text-green-600 mt-1">Requests for code</div>
                    </div>
                    
                    <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">Comparison Requests</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{portrait?.learning_patterns?.comparisonRequests ?? '—'}</div>
                      <div className="text-xs text-green-600 mt-1">Requests for comparisons</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge Gap Visualization */}
              <div className="md:col-span-2">
                <KnowledgeGapVisualization 
                  topics={portrait?.knowledge_topics || []}
                />
              </div>

            </div>
            </>
            )}
          </div>
            </div>
        </div>
      </div>
      {/* Info Modal */}
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 p-1.5">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              About Learning Portrait
            </DialogTitle>
            <DialogDescription>
              Generate a concise learning portrait tailored from your usage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <div className="font-medium text-gray-900">Learning Portrait</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Click Generate / Refresh to build your portrait.</li>
                <li>Review summary, strengths, challenges, and next questions.</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="default">Got it</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default LearningPage
