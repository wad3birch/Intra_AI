import { getServerProfile } from "@/lib/server/server-chat-helpers"
import { PDFExportRequest } from "@/types/learning"
import { NextResponse } from "next/server"

// Mock data storage (replace with database in production)
let knowledgeCards: any[] = []

export async function POST(request: Request) {
  try {
    const profile = await getServerProfile()
    const body: PDFExportRequest = await request.json()
    
    // Get the cards to export
    const cardsToExport = knowledgeCards.filter(card => 
      body.card_ids.includes(card.id) && card.user_id === profile.user_id
    )
    
    if (cardsToExport.length === 0) {
      return NextResponse.json(
        { error: "No cards found to export" },
        { status: 404 }
      )
    }
    
    // Generate PDF content
    const pdfContent = generatePDFContent(cardsToExport, body.template, body.include_sources)
    
    // In a real implementation, you would use a PDF generation library like puppeteer or jsPDF
    // For now, we'll return the HTML content that can be converted to PDF
    return NextResponse.json({ 
      success: true, 
      pdfContent,
      filename: `knowledge-cards-${Date.now()}.html`
    })
  } catch (error) {
    console.error("Error exporting PDF:", error)
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    )
  }
}

function generatePDFContent(cards: any[], template: string, includeSources: boolean): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const cardHTML = cards.map(card => `
    <div class="knowledge-card">
      <h2 class="card-title">${card.title}</h2>
      <div class="card-content">
        <div class="section">
          <h3>Core Concept</h3>
          <p>${card.content.core_concept}</p>
        </div>
        
        <div class="section">
          <h3>Key Points</h3>
          <ul>
            ${card.content.key_points.map((point: string) => `<li>${point}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Examples</h3>
          <ul>
            ${card.content.examples.map((example: string) => `<li>${example}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Related Concepts</h3>
          <ul>
            ${card.content.related_concepts.map((concept: string) => `<li>${concept}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Memory Tips</h3>
          <ul>
            ${card.content.memory_tips.map((tip: string) => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3>Practice Questions</h3>
          <ul>
            ${card.content.practice_questions.map((question: string) => `<li>${question}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Knowledge Cards Export</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #133962;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #133962;
            margin: 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .knowledge-card {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .card-title {
            color: #133962;
            border-bottom: 2px solid #133962;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .section {
            margin-bottom: 15px;
        }
        .section h3 {
            color: #133962;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .section ul {
            margin: 0;
            padding-left: 20px;
        }
        .section li {
            margin-bottom: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .header { page-break-after: avoid; }
            .knowledge-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Knowledge Cards</h1>
        <p class="subtitle">Generated on: ${currentDate}</p>
        <p class="subtitle">Total Cards: ${cards.length}</p>
    </div>
    
    ${cardHTML}
    
    <div class="footer">
        <p>Generated by IntraAI Learning Companion</p>
    </div>
</body>
</html>
  `
}
