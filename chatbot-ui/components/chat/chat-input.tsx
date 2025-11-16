import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconBolt,
  IconCirclePlus,
  IconPlayerStopFilled,
  IconSend,
  IconTag,
  IconX,
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { Badge } from "../ui/badge"
import { ChatCommandInput } from "./chat-command-input"
import { ChatFilesDisplay } from "./chat-files-display"
import { ChatTagSelector } from "./chat-tag-selector"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { TagService } from '@/lib/supabase/tags'
import { CustomTag, SelectedTagWithParams } from '@/lib/types/tags'
import { getTagColor, getCustomTagStyle, isCustomColor, createSelectedTagFromName } from '@/lib/utils/tag-utils'

interface ChatInputProps {}


export const ChatInput: FC<ChatInputProps> = ({}) => {
  const { t } = useTranslation()

  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const [isTyping, setIsTyping] = useState<boolean>(false)
  // 将 selectedTags 改回对象数组
  const [selectedTags, setSelectedTags] = useState<SelectedTagWithParams[]>([])
  const [showTagSelector, setShowTagSelector] = useState<boolean>(false)
  const [pendingTag, setPendingTag] = useState<{ tagName: string; paramsDef: any[] } | null>(null)
  const [paramValues, setParamValues] = useState<{ [k: string]: any }>({})
  
  // Add parameter cache to avoid repeated API calls
  const [parameterCache, setParameterCache] = useState<{ [tagName: string]: any[] }>({})
  // Add loading state for better UX
  const [loadingTag, setLoadingTag] = useState<string | null>(null)
  

  // Define tags with parameters here
  const tagsWithParameters = ['translate', 'code-generator']

  const {
    isAssistantPickerOpen,
    focusAssistant,
    setFocusAssistant,
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    focusTool,
    setFocusTool,
    isToolPickerOpen,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setFocusFile,
    chatSettings,
    selectedTools,
    setSelectedTools,
    assistantImages,
    setUserInput
  } = useContext(ChatbotUIContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()

  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()

  const {
    setNewMessageContentToPreviousUserMessage,
    setNewMessageContentToNextUserMessage
  } = useChatHistoryHandler()

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => {
      handleFocusChatInput()
    }, 200) // FIX: hacky
  }, [selectedPreset, selectedAssistant])


  // 修改预加载逻辑，从数据库加载参数
  useEffect(() => {
    const preloadCommonTags = async () => {
      try {
        // 从数据库加载 code-generator 标签的参数
        const codeGeneratorParams = await TagService.getTagParametersByName('code-generator')
        
        if (codeGeneratorParams.length > 0) {
          setParameterCache(prev => ({ 
            ...prev, 
            'code-generator': codeGeneratorParams 
          }))
        } else {
          // 如果数据库中没有，使用硬编码参数作为后备
          const fallbackParams = [
            {
              name: 'programmingLanguage',
              type: 'select',
              label: 'Programming Language',
              required: true,
              options: [
                { value: 'JavaScript', label: 'JavaScript' },
                { value: 'TypeScript', label: 'TypeScript' },
                { value: 'Python', label: 'Python' },
                { value: 'Java', label: 'Java' },
                { value: 'C++', label: 'C++' },
                { value: 'C#', label: 'C#' },
                { value: 'Go', label: 'Go' },
                { value: 'Rust', label: 'Rust' },
                { value: 'PHP', label: 'PHP' },
                { value: 'Ruby', label: 'Ruby' }
              ]
            }
          ]
          
          setParameterCache(prev => ({ 
            ...prev, 
            'code-generator': fallbackParams 
          }))
        }
        
        // 对 translate 标签调用 API
        const translatePromise = fetch('/api/tag-parameters-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagName: 'translate' })
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            return { tagName: 'translate', params: data.parameters || [] }
          }
          return { tagName: 'translate', params: [] }
        }).catch(() => ({ tagName: 'translate', params: [] }))
        
        const result = await translatePromise
        setParameterCache(prev => ({ 
          ...prev, 
          [result.tagName]: result.params 
        }))
      } catch (error) {
        console.error('Error preloading tags:', error)
      }
    }
    
    preloadCommonTags()
  }, [])

  // 修改 handleInputTextChange 函数，不再解析文本中的tags
  const handleInputTextChange = (value: string) => {
    setUserInput(value)
  }

  // 生成提示时使用对象数组
  const generatePromptFromTags = (tags: SelectedTagWithParams[]): string => {
    const allTags = [
      // Identity tags
      { name: 'teacher', prompt: 'You are a knowledgeable teacher who explains concepts clearly and patiently.' },
      { name: 'lawyer', prompt: 'You are a professional lawyer with expertise in legal matters.' },
      { name: 'friend', prompt: 'You are a supportive friend who provides encouragement and practical advice.' },
      { name: 'scientist', prompt: 'You are a research scientist who approaches problems methodically and evidence-based.' },
      
      // Style tags
      { name: 'concise', prompt: 'Keep your responses concise and under 200 words. Focus on key points only.' },
      { name: 'detailed', prompt: 'Provide detailed, comprehensive explanations with examples and context.' },
      { name: 'humorous', prompt: 'Use appropriate humor, wit, and light-heartedness in your responses.' },
      { name: 'formal', prompt: 'Use formal, professional language and tone throughout your response.' },
      
      // Level tags
      { name: 'middle-school', prompt: 'Use vocabulary and concepts appropriate for middle school students (ages 11-14).' },
      { name: 'high-school', prompt: 'Use vocabulary and concepts appropriate for high school students (ages 15-18).' },
      { name: 'expert', prompt: 'Use advanced, expert-level terminology and assume deep domain knowledge.' },
      { name: 'beginner', prompt: 'Use simple, beginner-friendly language with clear explanations.' },
      
      // Values tags
      { name: 'neutral', prompt: 'Maintain a neutral, unbiased perspective in your response.' },
      { name: 'critical', prompt: 'Provide critical analysis and question assumptions in your response.' },
      { name: 'optimistic', prompt: 'Maintain an optimistic, positive outlook in your response.' },
      { name: 'practical', prompt: 'Focus on practical, actionable applications and real-world examples.' },
      
      // Task tags
      { name: 'summarize', prompt: 'Summarize the main points and key takeaways.' },
      { name: 'translate', prompt: 'Provide accurate translation between languages.' },
      { name: 'debate', prompt: 'Present multiple perspectives and arguments for debate.' },
      { name: 'brainstorm', prompt: 'Generate creative ideas and brainstorm solutions.' }
    ]

    // Load custom tags from localStorage
    const savedTags = localStorage.getItem('custom-tags')
    if (savedTags) {
      const customTags = JSON.parse(savedTags)
      allTags.push(...customTags.map((tag: any) => ({ name: tag.name, prompt: tag.prompt })))
    }

    const selectedTagObjects = allTags.filter(tag => tags.some(t => t.name === tag.name))
    return selectedTagObjects.map(tag => tag.prompt).join(' ')
  }

  const handleSendMessageWithTags = async (messageContent: string, messages: any[], isRegeneration: boolean) => {
    let finalMessage = messageContent
    
    
    // If tags are selected, prepend the generated prompt
    if (selectedTags.length > 0) {
      const tagPrompt = generatePromptFromTags(selectedTags)
      finalMessage = `${tagPrompt}\n\n${finalMessage}`
    }
    
    await handleSendMessage(finalMessage, messages, isRegeneration)
    
    // Clear tags after sending
    setSelectedTags([])
  }

  // 修改handleTagSelect函数，使其能够正确处理自定义标签的参数
  const handleTagSelect = useCallback(async (tagName: string) => {
    console.log('Tag selected:', tagName)
    
    // 检查是否已经在选中列表中
    if (selectedTags.some(t => t.name === tagName)) {
      return
    }

    setLoadingTag(tagName)

    try {
      let paramsDef: any[] = []

      // 首先检查缓存
      if (parameterCache[tagName]) {
        paramsDef = parameterCache[tagName]
      } else {
        // 尝试从数据库获取自定义标签的参数
        try {
          paramsDef = await TagService.getTagParametersByName(tagName)
          // 缓存结果
          setParameterCache(prev => ({ ...prev, [tagName]: paramsDef }))
        } catch (error) {
          console.log('No custom tag found, checking predefined parameters')
          // 如果数据库中没有找到，检查预定义参数
          if (tagName === 'translate') {
            paramsDef = [
              {
                name: 'targetLanguage',
                label: 'Target Language',
                type: 'select',
                required: true,
                options: [
                  { value: 'Chinese', label: 'Chinese (中文)' },
                  { value: 'English', label: 'English' },
                  { value: 'Spanish', label: 'Spanish (Español)' },
                  { value: 'French', label: 'French (Français)' },
                  { value: 'German', label: 'German (Deutsch)' },
                  { value: 'Japanese', label: 'Japanese (日本語)' },
                  { value: 'Korean', label: 'Korean (한국어)' }
                ],
                order_index: 0
              }
            ]
          } else if (tagName === 'code-generator') {
            paramsDef = [
              {
                name: 'programmingLanguage',
                label: 'Programming Language',
                type: 'select',
                required: true,
                options: [
                  { value: 'JavaScript', label: 'JavaScript' },
                  { value: 'TypeScript', label: 'TypeScript' },
                  { value: 'Python', label: 'Python' },
                  { value: 'Java', label: 'Java' },
                  { value: 'C++', label: 'C++' },
                  { value: 'C#', label: 'C#' },
                  { value: 'Go', label: 'Go' },
                  { value: 'Rust', label: 'Rust' }
                ],
                order_index: 0
              }
            ]
          }
          // 缓存结果
          setParameterCache(prev => ({ ...prev, [tagName]: paramsDef }))
        }
      }

      setLoadingTag(null)

      // 如果没有参数，直接添加标签
      if (paramsDef.length === 0) {
        console.log('No parameters for tag:', tagName)
        const newTag = createSelectedTagFromName(tagName)
        const newTags = [...selectedTags, newTag]
        setSelectedTags(newTags)
        return
      }

      // 显示参数表单
      console.log('Showing parameter form for tag:', tagName, 'with params:', paramsDef)
      setPendingTag({ tagName, paramsDef })
      setParamValues(
        Object.fromEntries(
          paramsDef.map((p: any) => [
            p.name,
            p.default_value ?? (p.type === 'boolean' ? false : (p.options?.[0]?.value ?? ''))
          ])
        )
      )
    } catch (error) {
      console.error('Error fetching parameters:', error)
      setLoadingTag(null)
      // 如果出错，直接添加标签
      const newTag = createSelectedTagFromName(tagName)
      const newTags = [...selectedTags, newTag]
      setSelectedTags(newTags)
    }
  }, [selectedTags, parameterCache])

  // 简化的 handleKeyDown 函数，不再处理文本中的tags
  const handleKeyDown = (event: React.KeyboardEvent) => {

    // Handle Enter key to send message
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      setIsPromptPickerOpen(false)
      handleSendMessageWithTags(userInput, chatMessages, false)
    }

    // Consolidate conditions to avoid TypeScript error
    if (
      isPromptPickerOpen ||
      isFilePickerOpen ||
      isToolPickerOpen ||
      isAssistantPickerOpen
    ) {
      if (
        event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault()
        // Toggle focus based on picker type
        if (isPromptPickerOpen) setFocusPrompt(!focusPrompt)
        if (isFilePickerOpen) setFocusFile(!focusFile)
        if (isToolPickerOpen) setFocusTool(!focusTool)
        if (isAssistantPickerOpen) setFocusAssistant(!focusAssistant)
      }
    }

    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    //use shift+ctrl+up and shift+ctrl+down to navigate through chat history
    if (event.key === "ArrowUp" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToPreviousUserMessage()
    }

    if (event.key === "ArrowDown" && event.shiftKey && event.ctrlKey) {
      event.preventDefault()
      setNewMessageContentToNextUserMessage()
    }

    if (
      isAssistantPickerOpen &&
      (event.key === "Tab" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault()
      setFocusAssistant(!focusAssistant)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  // 在组件中添加一个清除缓存的功能
  const clearParameterCache = () => {
    setParameterCache({})
    // 也可以清除 localStorage 中的相关缓存
    localStorage.removeItem('tag-parameter-cache')
  }

  // 在开发时，您可以在浏览器控制台中调用：
  // window.clearParameterCache?.()

  return (
    <>
      <div className="flex flex-col flex-wrap justify-center gap-2">
        <ChatFilesDisplay />

        {selectedTools &&
          selectedTools.map((tool, index) => (
            <div
              key={index}
              className="flex justify-center"
              onClick={() =>
                setSelectedTools(
                  selectedTools.filter(
                    selectedTool => selectedTool.id !== tool.id
                  )
                )
              }
            >
              <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
                <IconBolt size={20} />

                <div>{tool.name}</div>
              </div>
            </div>
          ))}

        {selectedTags.length > 0 && (
          <div className="flex justify-center flex-wrap gap-2">
            {selectedTags.map(tag => {
              const isCustom = isCustomColor(tag.color)
              
              return (
                <div
                  key={tag.name}
                  className={`flex items-center space-x-1 rounded-lg px-3 py-1 border ${isCustom ? 'custom-tag-color' : getTagColor(tag.name, tag.color)}`}
                  style={isCustom ? getCustomTagStyle(tag.color!) : undefined}
                >
                  <IconTag size={16} />
                  <div className="text-sm">#{tag.name}</div>
                  <button
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    onClick={() => {
                      setSelectedTags(selectedTags.filter(t => t.name !== tag.name))
                    }}
                    title="Remove tag"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {selectedAssistant && (
          <div className="border-primary mx-auto flex w-fit items-center space-x-2 rounded-lg border p-1.5">
            {selectedAssistant.image_path && (
              <Image
                className="rounded"
                src={
                  assistantImages.find(
                    img => img.path === selectedAssistant.image_path
                  )?.base64
                }
                width={28}
                height={28}
                alt={selectedAssistant.name}
              />
            )}

            <div className="text-sm font-bold">
              Talking to {selectedAssistant.name}
            </div>
          </div>
        )}

      </div>

      <div className="border-input relative mt-3 flex min-h-[60px] w-full items-center justify-center rounded-xl border-2">
        <div className="absolute bottom-[76px] left-0 max-h-[300px] w-full overflow-auto rounded-xl dark:border-none">
          <ChatCommandInput />
        </div>

        {showTagSelector && (
          <ChatTagSelector
            selectedTags={selectedTags}
            onTagsChange={(newTags) => {
              setSelectedTags(newTags)
            }}
            onClose={() => setShowTagSelector(false)}
            onTagSelect={handleTagSelect}
            loadingTag={loadingTag}
          />
        )}


        {pendingTag && (
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
            <div className="rounded-lg border bg-background p-3 shadow-lg max-w-md mx-auto">
              <div className="mb-2 font-medium text-sm">#{pendingTag.tagName} parameters</div>
              <div className="grid grid-cols-1 gap-2">
                {pendingTag.paramsDef.map((p: any) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-32 text-sm text-muted-foreground">{p.label || p.name}</div>
                    {p.type === 'select' ? (
                      <select
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={paramValues[p.name] ?? ''}
                        onChange={e => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                      >
                        {(p.options || []).map((opt: any) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : p.type === 'number' ? (
                      <input
                        type="number"
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={paramValues[p.name] ?? ''}
                        onChange={e => setParamValues({ ...paramValues, [p.name]: Number(e.target.value) })}
                        placeholder={p.placeholder}
                      />
                    ) : p.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={!!paramValues[p.name]}
                        onChange={e => setParamValues({ ...paramValues, [p.name]: e.target.checked })}
                      />
                    ) : (
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={paramValues[p.name] ?? ''}
                        onChange={e => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                        placeholder={p.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="rounded border px-3 py-1 text-sm hover:bg-muted"
                  onClick={() => { setPendingTag(null); setParamValues({}) }}
                >
                  Cancel
                </button>
                <button
                  className="rounded bg-primary px-3 py-1 text-primary-foreground text-sm hover:bg-primary/90"
                  onClick={() => {
                    const newTag = { name: pendingTag.tagName, parameters: { ...paramValues } }
                    if (!selectedTags.some(t => t.name === newTag.name)) {
                      const newTags = [...selectedTags, newTag]
                      setSelectedTags(newTags)
                    }
                    setPendingTag(null)
                    setParamValues({})
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <>
          <IconCirclePlus
            className="absolute bottom-[12px] left-3 cursor-pointer p-1 hover:opacity-50"
            size={32}
            onClick={() => fileInputRef.current?.click()}
          />

          <IconTag
            className="absolute bottom-[12px] left-12 cursor-pointer p-1 hover:opacity-50"
            size={32}
            onClick={() => setShowTagSelector(!showTagSelector)}
          />


          {/* Hidden input to select files from device */}
          <Input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={e => {
              if (!e.target.files) return
              handleSelectDeviceFile(e.target.files[0])
            }}
            accept={filesToAccept}
          />
        </>

        <TextareaAutosize
          textareaRef={chatInputRef}
          className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-md flex w-full resize-none rounded-md border-none bg-transparent px-28 py-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t(
            // `Ask anything. Type "@" for assistants, "/" for prompts, "#" for files, and "!" for tools.`
            `Ask anything. Type @  /  #  ! or click tag icon for tags`
          )}
          onValueChange={handleInputTextChange}
          value={userInput}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />

        <div className="absolute bottom-[14px] right-3 cursor-pointer hover:opacity-50">
          {isGenerating ? (
            <IconPlayerStopFilled
              className="hover:bg-background animate-pulse rounded bg-transparent p-1"
              onClick={handleStopMessage}
              size={30}
            />
          ) : (
            <IconSend
              className={cn(
                "bg-primary text-secondary rounded p-1",
                !userInput && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                if (!userInput) return

                handleSendMessageWithTags(userInput, chatMessages, false)
              }}
              size={30}
            />
          )}
        </div>
      </div>
    </>
  )
}
