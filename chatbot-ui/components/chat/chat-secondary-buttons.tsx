import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { IconInfoCircle, IconMessagePlus, IconFlask, IconBrain } from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { WithTooltip } from "../ui/with-tooltip"
import { Button } from "@/components/ui/button"
import { ABTestManager } from "@/components/ab-test/ab-test-manager"

interface ChatSecondaryButtonsProps {}

export const ChatSecondaryButtons: FC<ChatSecondaryButtonsProps> = ({}) => {
  const { selectedChat, chatSettings, setChatSettings } = useContext(ChatbotUIContext)
  const { handleNewChat } = useChatHandler()
  const [showABTest, setShowABTest] = useState(false)

  const toggleDeepDive = () => {
    if (chatSettings) {
      setChatSettings({
        ...chatSettings,
        deepDiveEnabled: !chatSettings.deepDiveEnabled
      })
    }
  }

  return (
    <>
      {selectedChat && (
        <>
          <WithTooltip
            delayDuration={200}
            display={
              <div>
                <div className="text-xl font-bold">Chat Info</div>

                <div className="mx-auto mt-2 max-w-xs space-y-2 sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <div>Model: {selectedChat.model}</div>
                  <div>Prompt: {selectedChat.prompt}</div>

                  <div>Temperature: {selectedChat.temperature}</div>
                  <div>Context Length: {selectedChat.context_length}</div>

                  <div>
                    Profile Context:{" "}
                    {selectedChat.include_profile_context
                      ? "Enabled"
                      : "Disabled"}
                  </div>
                  <div>
                    {" "}
                    Workspace Instructions:{" "}
                    {selectedChat.include_workspace_instructions
                      ? "Enabled"
                      : "Disabled"}
                  </div>

                  <div>
                    Embeddings Provider: {selectedChat.embeddings_provider}
                  </div>
                </div>
              </div>
            }
            trigger={
              <div className="mt-1">
                <IconInfoCircle
                  className="cursor-default hover:opacity-50"
                  size={24}
                />
              </div>
            }
          />

          <WithTooltip
            delayDuration={200}
            display={<div>Start a new chat</div>}
            trigger={
              <div className="mt-1">
                <IconMessagePlus
                  className="cursor-pointer hover:opacity-50"
                  size={24}
                  onClick={handleNewChat}
                />
              </div>
            }
          />

          {/* Deep Dive 切换按钮 */}
          <WithTooltip
            delayDuration={200}
            display={
              <div>
                <div className="text-sm font-medium">
                  {chatSettings?.deepDiveEnabled ? "Disable" : "Enable"} Deep Dive
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {chatSettings?.deepDiveEnabled 
                    ? "Click to disable interactive text selection" 
                    : "Click to enable interactive text selection for deeper exploration"
                  }
                </div>
              </div>
            }
            trigger={
              <div className="mt-1">
                <Button
                  variant={chatSettings?.deepDiveEnabled ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleDeepDive}
                  className={`flex items-center space-x-1 ${
                    chatSettings?.deepDiveEnabled 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"
                  }`}
                >
                  <IconBrain size={16} />
                  {chatSettings?.deepDiveEnabled && (
                    <span className="text-xs">ON</span>
                  )}
                </Button>
              </div>
            }
          />

          <WithTooltip
            delayDuration={200}
            display={<div>A/B Test Models</div>}
            trigger={
              <div className="mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowABTest(true)}
                  title="A/B Test Models"
                >
                  <IconFlask size={16} />
                </Button>
              </div>
            }
          />

          {showABTest && (
            <ABTestManager onClose={() => setShowABTest(false)} />
          )}
        </>
      )}
    </>
  )
}
