import React, { FC, useState, useCallback, useRef, useEffect } from "react"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { MessageCodeBlock } from "./message-codeblock"
import { MessageMarkdownMemoized } from "./message-markdown-memoized"
import { DeepDiveModal } from "./deep-dive-modal"

interface MessageMarkdownDeepDiveProps {
  content: string
  messageId: string
  originalQuestion?: string
}

export const MessageMarkdownDeepDive: FC<MessageMarkdownDeepDiveProps> = ({ 
  content, 
  messageId, 
  originalQuestion 
}) => {
  const [selectedText, setSelectedText] = useState("")
  const [showDeepDive, setShowDeepDive] = useState(false)
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 })
  const [highlightedRange, setHighlightedRange] = useState<Range | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Add selection highlighting styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .deep-dive-highlight {
        background-color: rgba(59, 130, 246, 0.2) !important;
        border-radius: 3px;
        padding: 1px 2px;
        transition: background-color 0.2s ease;
      }
      .deep-dive-highlight:hover {
        background-color: rgba(59, 130, 246, 0.3) !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const clearHighlight = useCallback(() => {
    if (highlightedRange) {
      // Remove highlight class from all elements
      const highlightedElements = document.querySelectorAll('.deep-dive-highlight')
      highlightedElements.forEach(el => {
        el.classList.remove('deep-dive-highlight')
        // Restore original styling
        const parent = el.parentNode
        if (parent) {
          const textNode = document.createTextNode(el.textContent || '')
          parent.replaceChild(textNode, el)
          parent.normalize()
        }
      })
      setHighlightedRange(null)
    }
  }, [highlightedRange])

  const highlightSelection = useCallback((range: Range) => {
    clearHighlight()
    
    try {
      // Create a wrapper span for the selected text
      const span = document.createElement('span')
      span.className = 'deep-dive-highlight'
      
      // Clone the range contents
      const contents = range.cloneContents()
      span.appendChild(contents)
      
      // Replace the range with the highlighted span
      range.deleteContents()
      range.insertNode(span)
      
      setHighlightedRange(range)
    } catch (error) {
      console.warn('Failed to highlight selection:', error)
    }
  }, [clearHighlight])

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim()
      if (selectedText.length > 5) { // Minimum 5 characters to trigger
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        // Check if selection is within container
        if (containerRef.current?.contains(range.commonAncestorContainer)) {
          setSelectedText(selectedText)
          setSelectionPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top + window.scrollY
          })
          
          // Highlight the selection
          highlightSelection(range.cloneRange())
          
          setShowDeepDive(true)
        }
      }
    }
  }, [highlightSelection])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Delay execution to ensure selection is complete
    setTimeout(() => {
      handleTextSelection()
    }, 50)
  }, [handleTextSelection])

  const closeDeepDive = useCallback(() => {
    setShowDeepDive(false)
    setSelectedText("")
    clearHighlight()
    // Clear text selection
    window.getSelection()?.removeAllRanges()
  }, [clearHighlight])

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="select-text">
      <MessageMarkdownMemoized
        className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 min-w-full space-y-6 break-words"
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>
          },
          img({ node, ...props }) {
            return <img className="max-w-[67%]" {...props} />
          },
          code({ node, className, children, ...props }) {
            const childArray = React.Children.toArray(children)
            const firstChild = childArray[0] as React.ReactElement
            const firstChildAsString = React.isValidElement(firstChild)
              ? (firstChild as React.ReactElement).props.children
              : firstChild

            if (firstChildAsString === "▍") {
              return <span className="mt-1 animate-pulse cursor-default">▍</span>
            }

            if (typeof firstChildAsString === "string") {
              childArray[0] = firstChildAsString.replace("`▍`", "▍")
            }

            const match = /language-(\w+)/.exec(className || "")

            if (
              typeof firstChildAsString === "string" &&
              !firstChildAsString.includes("\n")
            ) {
              return (
                <code className={className} {...props}>
                  {childArray}
                </code>
              )
            }

            return (
              <MessageCodeBlock
                key={Math.random()}
                language={(match && match[1]) || ""}
                value={String(childArray).replace(/\n$/, "")}
                {...props}
              />
            )
          }
        }}
      >
        {content}
      </MessageMarkdownMemoized>

      {showDeepDive && (
        <DeepDiveModal
          selectedText={selectedText}
          originalContent={content}
          originalQuestion={originalQuestion}
          position={selectionPosition}
          onClose={closeDeepDive}
        />
      )}
    </div>
  )
}
