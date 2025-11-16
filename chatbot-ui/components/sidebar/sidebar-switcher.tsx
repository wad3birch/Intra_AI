import { ContentType } from "@/types"
import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBooks,
  IconFile,
  IconMessage,
  IconPencil,
  IconRobotFace,
  IconSparkles,
  IconEye,
  IconFlask, // 修改：使用Flask图标替代TestPipe
  IconMessageCircle,
  IconTags,
  IconSchool
} from "@tabler/icons-react"
import { FC } from "react"
import { useRouter, useParams } from "next/navigation"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  const router = useRouter()
  const params = useParams()

  const handleTextAwarenessClick = () => {
    // Get workspace ID from URL params
    const workspaceId = params.workspaceid as string
    router.push(`/${workspaceId}/token-awareness`)
  }

  const handleABTestClick = () => {
    // Get workspace ID from URL params
    const workspaceId = params.workspaceid as string
    router.push(`/${workspaceId}/ab-test`)
  }

  const handleLearningCompanionClick = () => {
    // Get workspace ID from URL params
    const workspaceId = params.workspaceid as string
    router.push(`/${workspaceId}/learning-companion`)
  }

  const handleTagCustomizationClick = () => {
    // Get workspace ID from URL params
    const workspaceId = params.workspaceid as string
    router.push(`/${workspaceId}/tag-customization`)
  }

  const handleLearningCenterClick = () => {
    // Get workspace ID from URL params
    const workspaceId = params.workspaceid as string
    router.push(`/${workspaceId}/learning`)
  }

  return (
    <div className="flex flex-col justify-between border-r-2 pb-5">
      <TabsList className="bg-background grid h-[480px] grid-rows-9">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconAdjustmentsHorizontal size={SIDEBAR_ICON_SIZE} />}
          contentType="presets"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconPencil size={SIDEBAR_ICON_SIZE} />}
          contentType="prompts"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconSparkles size={SIDEBAR_ICON_SIZE} />}
          contentType="models"
          onContentTypeChange={onContentTypeChange}
        />

        {/* <SidebarSwitchItem
          icon={<IconFile size={SIDEBAR_ICON_SIZE} />}
          contentType="files"
          onContentTypeChange={onContentTypeChange}
        /> */}

        {/* <SidebarSwitchItem
          icon={<IconBooks size={SIDEBAR_ICON_SIZE} />}
          contentType="collections"
          onContentTypeChange={onContentTypeChange}
        /> */}

        <SidebarSwitchItem
          icon={<IconRobotFace size={SIDEBAR_ICON_SIZE} />}
          contentType="assistants"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconBolt size={SIDEBAR_ICON_SIZE} />}
          contentType="tools"
          onContentTypeChange={onContentTypeChange}
        />

                {/* Special handling for text-awareness - navigate to dedicated page */}
                <WithTooltip
          display={<div>Alignment Signal Analyzer</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-md hover:opacity-50 transition-opacity"
              onClick={handleTextAwarenessClick}
            >
              <IconEye size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />

        {/* Special handling for Comparative Evaluation Analyzer - navigate to dedicated page */}
        <WithTooltip
          display={<div>Comparative Evaluation Analyzer</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-md hover:opacity-50 transition-opacity"
              onClick={handleABTestClick}
            >
              <IconFlask size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />

        {/* Special handling for Learning Companion - navigate to dedicated page */}
        <WithTooltip
          display={<div>Learning Companion</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-md hover:opacity-50 transition-opacity"
              onClick={handleLearningCompanionClick}
            >
              <IconMessageCircle size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />

        {/* Special handling for Learning Portrait - navigate to dedicated page */}
        <WithTooltip
          display={<div>Learning Portrait</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-md hover:opacity-50 transition-opacity"
              onClick={handleLearningCenterClick}
            >
              <IconSchool size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />

        {/* Special handling for Tag Customization - navigate to dedicated page */}
        <WithTooltip
          display={<div>Tag Customization</div>}
          trigger={
            <button
              className="flex h-12 w-12 items-center justify-center rounded-md hover:opacity-50 transition-opacity"
              onClick={handleTagCustomizationClick}
            >
              <IconTags size={SIDEBAR_ICON_SIZE} />
            </button>
          }
        />
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
        {/* TODO */}
        {/* <WithTooltip display={<div>Import</div>} trigger={<Import />} /> */}

        {/* TODO */}
        {/* <Alerts /> */}

        <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        />
      </div>
    </div>
  )
}
