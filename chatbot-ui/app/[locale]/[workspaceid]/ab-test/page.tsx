"use client"

import { FC, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, Check, Sparkles, TrendingUp, TrendingDown, Target, AlertCircle, BarChart3, Lightbulb, Zap, Brain, Building2, Download, FileText, TestTube } from "lucide-react"

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
  // 新增行业特定分析结果
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

// 行业配置 - 使用 Lucide 图标
const industryConfig = {
  general: {
    label: 'General',
    description: 'General content analysis without industry-specific focus',
    icon: BarChart3,
    metrics: ['content_quality', 'readability', 'engagement', 'clarity']
  },
  ecommerce: {
    label: 'E-commerce',
    description: 'Online retail and shopping platforms',
    icon: Building2,
    metrics: ['conversion_rate', 'product_appeal', 'trustworthiness', 'call_to_action']
  },
  technology: {
    label: 'Technology',
    description: 'Tech companies and software products',
    icon: Zap,
    metrics: ['technical_accuracy', 'innovation', 'usability', 'security']
  },
  healthcare: {
    label: 'Healthcare',
    description: 'Medical and health-related content',
    icon: Target,
    metrics: ['medical_accuracy', 'safety', 'trust', 'clarity']
  },
  education: {
    label: 'Education',
    description: 'Educational institutions and learning platforms',
    icon: Brain,
    metrics: ['educational_value', 'clarity', 'engagement', 'accessibility']
  },
  finance: {
    label: 'Finance',
    description: 'Financial services and banking',
    icon: TrendingUp,
    metrics: ['financial_accuracy', 'trust', 'compliance', 'clarity']
  }
}

export default function ABTestPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [versions, setVersions] = useState<{[key: string]: string}>({
    A: "",
    B: ""
  })
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof industryConfig>("general")
  const [analysis, setAnalysis] = useState<ABTestAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [versionCount, setVersionCount] = useState(2) // 默认2个版本

  useEffect(() => {
    const textAParam = searchParams.get("textA")
    const textBParam = searchParams.get("textB")
    const industryParam = searchParams.get("industry")
    
    if (textAParam) setVersions(prev => ({...prev, A: decodeURIComponent(textAParam)}))
    if (textBParam) setVersions(prev => ({...prev, B: decodeURIComponent(textBParam)}))
    if (industryParam && industryParam in industryConfig) {
      setSelectedIndustry(industryParam as keyof typeof industryConfig)
    }
  }, [searchParams])

  const copyToClipboard = async (text: string, version: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(version)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // 添加新版本
  const addVersion = () => {
    if (versionCount < 4) {
      const newVersion = String.fromCharCode(65 + versionCount) // A, B, C, D
      setVersions(prev => ({...prev, [newVersion]: ""}))
      setVersionCount(prev => prev + 1)
    }
  }

  // 删除版本
  const removeVersion = (versionKey: string) => {
    if (versionCount > 2) {
      const newVersions = {...versions}
      delete newVersions[versionKey]
      setVersions(newVersions)
      setVersionCount(prev => prev - 1)
    }
  }

  // 更新版本内容
  const updateVersion = (versionKey: string, content: string) => {
    setVersions(prev => ({...prev, [versionKey]: content}))
  }

  // 导出功能 - 生成PDF报告（16:9 学术海报风格）
  const exportToPDF = () => {
    if (!analysis) return

    try {
      const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const winner = parseWinner(analysis.recommendation)
      const industryLabel = industryConfig[selectedIndustry as keyof typeof industryConfig].label
      const versionKeys = Object.keys(versions).sort()
      const versionCount = versionKeys.length

      // Helper functions
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
        const paragraphs = text.split(/\n+/).filter(p => p.trim())
        return paragraphs.length > 0 
          ? paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('')
          : `<p>${escapeHtml(text.trim())}</p>`
      }

      const getConfidenceColor = (conf: number) => {
        if (conf >= 0.8) return 'var(--green-600)'
        if (conf >= 0.6) return 'var(--orange-600)'
        return 'var(--red-600)'
      }

      const getConfidenceBg = (conf: number) => {
        if (conf >= 0.8) return 'var(--green-100)'
        if (conf >= 0.6) return 'var(--orange-100)'
        return 'var(--red-100)'
      }

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Comparative Evaluation Analyzer</title>
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
      --pink-50: #fdf2f8;
      --orange-50: #fff7ed;
      --orange-100: #ffedd5;
      --orange-500: #f97316;
      --orange-600: #ea580c;
      --red-50: #fef2f2;
      --red-100: #fee2e2;
      --red-600: #dc2626;
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
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: var(--gray-700);
      text-align: right;
    }

    .header-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: ${getConfidenceBg(analysis.confidence)};
      color: ${getConfidenceColor(analysis.confidence)};
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

    .metric-card:nth-child(1) { background: linear-gradient(135deg, var(--green-50), var(--green-100)); border-color: var(--green-300); }
    .metric-card:nth-child(2) { background: linear-gradient(135deg, var(--blue-50), var(--blue-100)); border-color: var(--blue-300); }
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

    .progress-bar {
      width: 100%;
      height: 6px;
      background: var(--gray-200);
      border-radius: 3px;
      margin-top: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--blue-500), var(--blue-600));
      border-radius: 3px;
      transition: width 0.3s;
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

    /* Two Column Zone */
    .two-col-zone {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 8px;
    }

    .differences-zone {
      background: linear-gradient(135deg, var(--green-50), var(--green-100));
      border: 1px solid var(--green-200);
      border-radius: 12px;
      padding: 18px;
    }

    .differences-zone .section-title {
      color: var(--green-900);
    }

    .differences-zone .section-title::before {
      background: var(--green-600);
    }

    .comparison-zone {
      background: linear-gradient(135deg, var(--indigo-50), var(--purple-50));
      border: 1px solid var(--indigo-200);
      border-radius: 12px;
      padding: 18px;
    }

    .comparison-zone .section-title {
      color: var(--indigo-900);
    }

    .comparison-zone .section-title::before {
      background: var(--indigo-600);
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }

    .comparison-card {
      background: white;
      border: 1px solid var(--indigo-200);
      border-radius: 8px;
      padding: 12px;
    }

    .comparison-card-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--indigo-900);
      margin-bottom: 8px;
    }

    .strength-card {
      border-color: var(--green-300);
    }

    .weakness-card {
      border-color: var(--orange-300);
    }

    .strength-card .comparison-card-title {
      color: var(--green-800);
    }

    .weakness-card .comparison-card-title {
      color: var(--orange-800);
    }

    .list-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 11px;
      line-height: 1.5;
      color: var(--gray-800);
    }

    .list-item::before {
      content: "•";
      color: var(--indigo-600);
      font-weight: bold;
      font-size: 14px;
      margin-top: -2px;
    }

    .strength-card .list-item::before {
      color: var(--green-600);
    }

    .weakness-card .list-item::before {
      color: var(--orange-600);
    }

    .list-item:last-child {
      margin-bottom: 0;
    }

    /* Industry Analysis Zone */
    .industry-zone {
      background: linear-gradient(135deg, var(--purple-50), var(--pink-50));
      border: 1px solid var(--purple-200);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 8px;
    }

    .industry-zone .section-title {
      color: var(--purple-900);
    }

    .industry-zone .section-title::before {
      background: var(--purple-600);
    }

    .industry-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .industry-metric-version {
      background: white;
      border: 1px solid var(--purple-200);
      border-radius: 8px;
      padding: 12px;
    }

    .industry-metric-version h4 {
      font-size: 13px;
      font-weight: 600;
      color: var(--purple-900);
      margin-bottom: 10px;
    }

    .industry-metric-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--gray-100);
    }

    .industry-metric-item:last-child {
      border-bottom: none;
    }

    .industry-metric-name {
      font-size: 11px;
      color: var(--gray-700);
      text-transform: capitalize;
      flex: 1;
    }

    .industry-metric-bar {
      width: 60px;
      height: 4px;
      background: var(--gray-200);
      border-radius: 2px;
      margin: 0 8px;
    }

    .industry-metric-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--purple-500), var(--purple-600));
      border-radius: 2px;
    }

    .industry-metric-score {
      font-size: 11px;
      font-weight: 600;
      color: var(--purple-900);
      min-width: 35px;
      text-align: right;
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

    .recommendation-text {
      font-size: 12px;
      line-height: 1.6;
      color: var(--gray-800);
      margin-bottom: 12px;
    }

    .recommendation-highlight {
      background: white;
      border-left: 4px solid var(--green-600);
      padding: 10px 12px;
      border-radius: 6px;
      font-weight: 600;
      color: var(--green-900);
      margin-top: 8px;
    }

    .steps-box {
      background: linear-gradient(135deg, var(--purple-50), var(--pink-50));
      border: 1px solid var(--purple-200);
      border-radius: 12px;
      padding: 18px;
    }

    .steps-box .section-title {
      color: var(--purple-900);
      margin-bottom: 12px;
    }

    .steps-box .section-title::before {
      background: var(--purple-600);
    }

    .steps-box .list-item::before {
      color: var(--purple-600);
    }
  </style>
</head>
<body>
  <div class="poster-container">
    <!-- Header Zone -->
    <div class="header-zone">
      <div class="header-left">
        <div class="header-icon">🧪</div>
        <div class="header-title">Comparative Evaluation Analysis</div>
      </div>
      <div class="header-right">
        <div>Generated: ${escapeHtml(currentDate)}</div>
        <div>Industry: ${escapeHtml(industryLabel)}</div>
        <div class="header-badge">
          Confidence: ${(analysis.confidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>

    <!-- Quick Metrics Zone -->
    <div class="metrics-zone">
      <div class="metric-card">
        <div class="metric-label">Recommended Version</div>
        <div class="metric-value">${winner ? `Version ${winner}` : '—'}</div>
        <div class="metric-sublabel">${winner ? 'Winner' : 'No clear winner'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Confidence Level</div>
        <div class="metric-value">${(analysis.confidence * 100).toFixed(0)}%</div>
        <div class="metric-sublabel">Analysis Confidence</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${analysis.confidence * 100}%; background: ${getConfidenceColor(analysis.confidence)}"></div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Industry Type</div>
        <div class="metric-value">${escapeHtml(industryLabel)}</div>
        <div class="metric-sublabel">Analysis Context</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Test Versions</div>
        <div class="metric-value">${versionCount}</div>
        <div class="metric-sublabel">Versions Compared</div>
      </div>
    </div>

    <!-- Executive Summary Zone -->
    <div class="summary-zone">
      <div class="section-title">Executive Summary</div>
      <div class="summary-content">${formatSummaryText(analysis.summary)}</div>
    </div>

    <!-- Two Column Zone: Key Differences & Comparison -->
    <div class="two-col-zone">
      <!-- Key Differences -->
      <div class="differences-zone">
        <div class="section-title">Key Differences</div>
        ${analysis.keyDifferences.length > 0 ? 
          analysis.keyDifferences.slice(0, 6).map((diff, i) => 
            `<div class="list-item">${escapeHtml(diff)}</div>`
          ).join('') : 
          '<div style="color: var(--gray-600); font-size: 12px;">No differences identified</div>'
        }
        ${analysis.keyDifferences.length > 6 ? 
          `<div style="font-size: 11px; color: var(--gray-600); margin-top: 8px;">+ ${analysis.keyDifferences.length - 6} more differences</div>` : ''
        }
      </div>

      <!-- Version Comparison -->
      <div class="comparison-zone">
        <div class="section-title">Version Comparison</div>
        <div class="comparison-grid">
          <div class="comparison-card strength-card">
            <div class="comparison-card-title">↑ Version A Strengths</div>
            ${analysis.strengths.versionA && analysis.strengths.versionA.length > 0 ?
              analysis.strengths.versionA.slice(0, 3).map((s, i) => 
                `<div class="list-item">${escapeHtml(s)}</div>`
              ).join('') : 
              '<div style="color: var(--gray-600); font-size: 11px;">No strengths identified</div>'
            }
          </div>
          <div class="comparison-card strength-card">
            <div class="comparison-card-title">↑ Version B Strengths</div>
            ${analysis.strengths.versionB && analysis.strengths.versionB.length > 0 ?
              analysis.strengths.versionB.slice(0, 3).map((s, i) => 
                `<div class="list-item">${escapeHtml(s)}</div>`
              ).join('') : 
              '<div style="color: var(--gray-600); font-size: 11px;">No strengths identified</div>'
            }
          </div>
          <div class="comparison-card weakness-card">
            <div class="comparison-card-title">↓ Version A Weaknesses</div>
            ${analysis.weaknesses.versionA && analysis.weaknesses.versionA.length > 0 ?
              analysis.weaknesses.versionA.slice(0, 3).map((w, i) => 
                `<div class="list-item">${escapeHtml(w)}</div>`
              ).join('') : 
              '<div style="color: var(--gray-600); font-size: 11px;">No weaknesses identified</div>'
            }
          </div>
          <div class="comparison-card weakness-card">
            <div class="comparison-card-title">↓ Version B Weaknesses</div>
            ${analysis.weaknesses.versionB && analysis.weaknesses.versionB.length > 0 ?
              analysis.weaknesses.versionB.slice(0, 3).map((w, i) => 
                `<div class="list-item">${escapeHtml(w)}</div>`
              ).join('') : 
              '<div style="color: var(--gray-600); font-size: 11px;">No weaknesses identified</div>'
            }
          </div>
        </div>
      </div>
    </div>

    ${analysis.industryAnalysis ? `
    <!-- Industry Analysis Zone -->
    <div class="industry-zone">
      <div class="section-title">${escapeHtml(industryLabel)} Industry Analysis</div>
      <div class="industry-metrics">
        ${Object.entries(analysis.industryAnalysis.specificMetrics).map(([version, metrics]) => `
          <div class="industry-metric-version">
            <h4>Version ${version} Metrics</h4>
            ${Object.entries(metrics).map(([metric, score]) => `
              <div class="industry-metric-item">
                <span class="industry-metric-name">${escapeHtml(metric.replace(/_/g, ' '))}</span>
                <div class="industry-metric-bar">
                  <div class="industry-metric-fill" style="width: ${score * 100}%"></div>
                </div>
                <span class="industry-metric-score">${(score * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      ${analysis.industryAnalysis.industryRecommendations && analysis.industryAnalysis.industryRecommendations.length > 0 ? `
        <div style="margin-top: 12px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--purple-900); margin-bottom: 8px;">Industry Recommendations</div>
          ${analysis.industryAnalysis.industryRecommendations.slice(0, 4).map((rec, i) => 
            `<div class="list-item">${escapeHtml(rec)}</div>`
          ).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Recommendations Zone -->
    <div class="recommendations-zone">
      <div class="recommendations-box">
        <div class="section-title">AI Recommendation</div>
        <div class="recommendation-text">${escapeHtml(analysis.recommendation)}</div>
        ${winner ? `
          <div class="recommendation-highlight">
            ✓ Recommended: Version ${winner}
          </div>
        ` : ''}
      </div>
      <div class="steps-box">
        <div class="section-title">Key Insights</div>
        ${analysis.keyDifferences.length > 0 ?
          analysis.keyDifferences.slice(0, 4).map((diff, i) => 
            `<div class="list-item">${escapeHtml(diff)}</div>`
          ).join('') : 
          '<div style="color: var(--gray-600); font-size: 12px;">No insights available</div>'
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
      setError('Failed to export PDF. Please try again.')
    }
  }

  // 导出为JSON格式
  const exportToJSON = () => {
    if (!analysis) return

    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        industry: selectedIndustry,
        industryLabel: industryConfig[selectedIndustry as keyof typeof industryConfig].label,
        versionCount: versionCount
      },
      testContent: versions,
      analysis
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `multi-version-test-analysis-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const runAnalysis = async () => {
    const versionKeys = Object.keys(versions)
    const hasContent = versionKeys.some(key => versions[key].trim())
    
    if (!hasContent) {
      setError("Please enter content for at least one version")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ab-test/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versions: versions,
          industry: selectedIndustry
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Analysis failed")
      }

      const result = await response.json()
      setAnalysis(result)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return "✅"
    if (confidence >= 0.6) return "⚠️"
    return "❌"
  }

  const getMetricColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getMetricBackground = (score: number) => {
    if (score >= 0.8) return "bg-green-500"
    if (score >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  // 从推荐语中解析优胜版本（Version A/B/C/D）
  const parseWinner = (text: string) => {
    if (!text) return null
    const match = text.match(/Version\s+([A-D])/i)
    return match ? match[1].toUpperCase() : null
  }

  // 获取当前选中行业的图标组件
  const CurrentIndustryIcon = industryConfig[selectedIndustry].icon

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                <TestTube size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Comparative Evaluation Analyzer
                </h1>
                <p className="text-sm text-gray-500">AI-powered content comparison and optimization</p>
              </div>
            </div>
          </div>
          
          {/* 行业选择器 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-100 rounded">
                <CurrentIndustryIcon size={16} className="text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Industry:</span>
            </div>
            <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as keyof typeof industryConfig)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(industryConfig).map(([key, config]) => {
                  const IconComponent = config.icon
                  return (
                    <SelectItem key={key} value={key} className="flex items-center gap-2">
                      <IconComponent size={16} />
                      {config.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* 行业选择器 */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="border-b py-3 px-4" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))', borderColor: 'rgba(19, 57, 98, 0.2)' }}>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                <Building2 size={18} style={{ color: 'rgb(19, 57, 98)' }} />
              </div>
              <span className="text-lg font-semibold">Industry Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Industry</label>
                <Select value={selectedIndustry} onValueChange={(v) => setSelectedIndustry(v as keyof typeof industryConfig)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(industryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                          <config.icon size={20} className="text-blue-600" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600 max-w-xs">
                <p className="font-medium">{industryConfig[selectedIndustry as keyof typeof industryConfig].label}</p>
                <p className="text-gray-500">{industryConfig[selectedIndustry as keyof typeof industryConfig].description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 版本管理区域 */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="border-b py-3 px-4" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))', borderColor: 'rgba(19, 57, 98, 0.2)' }}>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                  <Zap size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                </div>
                <span className="text-lg font-semibold">Version Management</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVersion}
                  disabled={versionCount >= 4}
                  className="flex items-center gap-2"
                >
                  <span>+</span>
                  Add Version
                </Button>
              </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {Object.entries(versions).map(([key, content]) => (
                <Card key={key} className="border-0 shadow-sm bg-white">
                  <CardHeader className="border-b py-3 px-4" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))', borderColor: 'rgba(19, 57, 98, 0.2)' }}>
              <CardTitle className="flex items-center justify-between text-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(19, 57, 98), rgb(19, 57, 98))' }}></div>
                        <span className="font-medium text-sm">Version {key}</span>
                </div>
                      <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                          onClick={() => copyToClipboard(content, key)}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-white/50"
                >
                          {copiedText === key ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </Button>
                        {versionCount > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVersion(key)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                </Button>
                        )}
                      </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <textarea
                      value={content}
                      onChange={(e) => updateVersion(key, e.target.value)}
                      placeholder={`Enter Version ${key} text here...`}
                      className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 transition-all duration-200 text-sm"
                style={{ 
                  '--tw-ring-color': 'rgba(19, 57, 98, 0.2)',
                  '--tw-border-color': 'rgb(19, 57, 98)'
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgb(19, 57, 98)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(19, 57, 98, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgb(209, 213, 219)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </CardContent>
          </Card>
              ))}
        </div>
          </CardContent>
        </Card>

        {/* 分析按钮 */}
        <div className="flex justify-center">
          <Button 
            onClick={runAnalysis}
            disabled={loading || !Object.values(versions).some(v => v.trim())}
            className="px-8 py-3 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg, rgb(19, 57, 98) 0%, rgb(19, 57, 98) 100%)',
              border: 'none'
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Content
              </>
            )}
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析结果 - 保持原有的结果展示逻辑，但适配多版本 */}
        {analysis && (
          <div className="space-y-4">
            {/* 导出操作栏 */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="flex items-center gap-2"
              >
                <FileText size={16} />
                Export JSON
              </Button>
              <Button
                size="sm"
                onClick={exportToPDF}
                className="text-white flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgb(19, 57, 98) 0%, rgb(19, 57, 98) 100%)',
                  border: 'none'
                }}
              >
                <Download size={16} />
                Export PDF
              </Button>
            </div>
            {/* 重点高亮 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                    <Target size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                  </div>
                  <span className="text-lg font-semibold">Key Highlights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {parseWinner(analysis.recommendation) && (
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: 'rgb(22,163,74)', border: '1px solid rgba(34,197,94,0.25)' }}
                    >
                      <TrendingUp size={14} />
                      Recommended: Version {parseWinner(analysis.recommendation)}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(analysis.confidence)}`}>
                    Confidence {getConfidenceIcon(analysis.confidence)} {(analysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {analysis.keyDifferences.slice(0, 3).map((diff, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{i + 1}</span>
                      </div>
                      <span className="text-base text-gray-700 leading-relaxed">{diff}</span>
                    </div>
                  ))}
                </div>

                {analysis.keyDifferences.length > 3 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">Show more differences</summary>
                    <div className="mt-2 space-y-2">
                      {analysis.keyDifferences.slice(3).map((diff, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.03)' }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.08)' }}>
                            <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{i + 4}</span>
                          </div>
                          <span className="text-base text-gray-700 leading-relaxed">{diff}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>

            {/* 总结 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                    <BarChart3 size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                  </div>
                  <span className="text-lg font-semibold">Analysis Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const summaryText = analysis.summary || ''
                  const parts = summaryText.split(/(?<=\.)\s/, 2)
                  const first = parts[0] || ''
                  const rest = parts[1] || ''
                  return (
                    <p className="text-base text-gray-700 leading-relaxed">
                      <span className="font-semibold">{first}</span>{rest ? ' ' + rest : ''}
                    </p>
                  )
                })()}
              </CardContent>
            </Card>

            {/* 行业特定分析 */}
            {analysis.industryAnalysis && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                      <Building2 size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                    </div>
                    <span className="text-lg font-semibold">
                      {industryConfig[analysis.industryAnalysis.industry as keyof typeof industryConfig]?.label} Analysis
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-6">
                    {/* 行业指标对比 */}
                    <div>
                      <h4 className="font-semibold text-base mb-4" style={{ color: 'rgb(19, 57, 98)' }}>Industry-Specific Metrics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(analysis.industryAnalysis.specificMetrics).map(([version, metrics]) => (
                          <div key={version}>
                            <h5 className="font-medium text-sm mb-3" style={{ color: 'rgb(19, 57, 98)' }}>Version {version}</h5>
                            <div className="space-y-2">
                              {Object.entries(metrics).map(([metric, score]) => (
                                <div key={metric} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                                  <span className="text-sm text-gray-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${getMetricBackground(score)}`}
                                        style={{ width: `${score * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-sm font-medium ${getMetricColor(score)}`}>
                                      {(score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 行业建议 */}
                    <div>
                      <h4 className="font-semibold text-base mb-3" style={{ color: 'rgb(19, 57, 98)' }}>Industry Recommendations</h4>
                      <div className="space-y-2">
                        {analysis.industryAnalysis.industryRecommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                              <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                            </div>
                            <span className="text-base text-gray-700 leading-relaxed">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 关键差异 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                    <Target size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                  </div>
                  <span className="text-lg font-semibold">Key Differences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {analysis.keyDifferences.map((difference, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                      </div>
                      <span className="text-base text-gray-700 leading-relaxed">{difference}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 优势分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Version A 优势 */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                      <TrendingUp size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                    </div>
                    <span className="text-lg font-semibold">Version A Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                        {analysis.strengths.versionA.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                            </div>
                        <span className="text-base text-gray-700 leading-relaxed">{strength}</span>
                          </div>
                        ))}
                      </div>
                </CardContent>
              </Card>

              {/* Version B 优势 */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                      <TrendingUp size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                    </div>
                    <span className="text-lg font-semibold">Version B Strengths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                        {analysis.strengths.versionB.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                            </div>
                        <span className="text-base text-gray-700 leading-relaxed">{strength}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 劣势分析 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Version A 劣势 */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                      <TrendingDown size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                    </div>
                    <span className="text-lg font-semibold">Version A Weaknesses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                        {analysis.weaknesses.versionA.map((weakness, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                            </div>
                        <span className="text-base text-gray-700 leading-relaxed">{weakness}</span>
                          </div>
                        ))}
                      </div>
                </CardContent>
              </Card>

              {/* Version B 劣势 */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                      <TrendingDown size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                    </div>
                    <span className="text-lg font-semibold">Version B Weaknesses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                        {analysis.weaknesses.versionB.map((weakness, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'rgb(19, 57, 98)' }}>{index + 1}</span>
                            </div>
                        <span className="text-base text-gray-700 leading-relaxed">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 推荐和建议 */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                    <Lightbulb size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                  </div>
                  <span className="text-lg font-semibold">Recommendation & Next Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.05)' }}>
                    <h4 className="font-semibold text-base mb-2" style={{ color: 'rgb(19, 57, 98)' }}>AI Recommendation</h4>
                    <p className="text-base text-gray-700 leading-relaxed">{analysis.recommendation}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'rgba(19, 57, 98, 0.2)' }}>
                      <h5 className="font-semibold text-sm mb-2" style={{ color: 'rgb(19, 57, 98)' }}>Confidence Level</h5>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getMetricBackground(analysis.confidence)}`}
                            style={{ width: `${analysis.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetricColor(analysis.confidence)}`}>
                          {(analysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'rgba(19, 57, 98, 0.2)' }}>
                      <h5 className="font-semibold text-sm mb-2" style={{ color: 'rgb(19, 57, 98)' }}>Analysis Type</h5>
                      <p className="text-sm text-gray-600">{industryConfig[selectedIndustry as keyof typeof industryConfig].label}</p>
                    </div>
                    
                    <div className="p-3 rounded-lg border" style={{ borderColor: 'rgba(19, 57, 98, 0.2)' }}>
                      <h5 className="font-semibold text-sm mb-2" style={{ color: 'rgb(19, 57, 98)' }}>Generated</h5>
                      <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Content - move to the very end for on-page view */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-200 py-2" style={{ background: 'linear-gradient(to right, rgba(19, 57, 98, 0.05), rgba(19, 57, 98, 0.1))' }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(19, 57, 98, 0.1)' }}>
                    <FileText size={18} style={{ color: 'rgb(19, 57, 98)' }} />
                  </div>
                  <span className="text-lg font-semibold">Test Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(versions).map(([key, content]) => (
                    <div key={key} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Version {key}</div>
                      <div className="whitespace-pre-wrap text-sm p-3 rounded-md border bg-gray-50" style={{ borderColor: 'rgba(19, 57, 98, 0.15)' }}>
                        {content || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
