// ChatHeader component

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Settings, 
  ChevronDown, 
  FileText, 
  Activity, 
  Trash2,
  Brain
} from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";
import { ChatSettings } from "@/types/chat";
import { useLocation } from "wouter";

interface ChatHeaderProps {
  conversationId: string;
  settings: ChatSettings;
  isLoading: boolean;
  onNewConversation: () => void;
  onSettingsToggle: () => void;
  onGenerateReport: () => void;
  onForceRefresh: () => void;
  onClearCache: () => void;
  onDownloadChat: () => void;
  onShareChat: () => void;
}

export default function ChatHeader({
  conversationId,
  settings,
  isLoading,
  onNewConversation,
  onSettingsToggle,
  onGenerateReport,
  onForceRefresh,
  onClearCache,
  onDownloadChat,
  onShareChat
}: ChatHeaderProps) {
  const { isOpen: isSettingsOpen, isGeneratingReport, isLoadingEnhancedData } = settings;
  const isDisabled = isLoading || isGeneratingReport || isLoadingEnhancedData;
  const [, navigate] = useLocation();

  return (
    <div className="chat-header bg-gradient-to-r from-blue-600 to-purple-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 flex items-center justify-between w-full">
      {/* Hamburger Menu - Left side */}
      <div className="flex-shrink-0">
        <HamburgerMenu
          onScreenshot={() => console.log('Screenshot taken')}
          onShareUrl={() => console.log('URL shared')}
          onCopyContent={() => console.log('Content copied')}
          onExportData={() => console.log('Data exported')}
          onDownloadChat={onDownloadChat}
          onShareChat={onShareChat}
        />
      </div>
      
      {/* New Conversation Button - Center Right */}
      <div className="flex-shrink-0 mr-1 sm:mr-2">
        <button
          onClick={onNewConversation}
          disabled={isDisabled}
          title="Start a new conversation (creates a new thread)"
          className={`flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-target ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Settings Dropdown - Right side */}
      <div className="relative settings-dropdown flex-shrink-0">
        <button
          onClick={onSettingsToggle}
          disabled={isDisabled}
          title="Chat settings and actions"
          className={`flex items-center gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors touch-target ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Settings</span>
          {isDisabled ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white ml-1"></div>
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </button>
        
        {isSettingsOpen && !isDisabled && (
          <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-background border border-border rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={onGenerateReport}
                disabled={isGeneratingReport || isLoadingEnhancedData}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 touch-target"
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm">
                  {isLoadingEnhancedData ? 'Fetching AI Data...' : isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </span>
              </button>
              <button
                onClick={() => navigate("/advanced-report")}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 touch-target"
              >
                <Brain className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Advanced Report Generator</span>
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={onForceRefresh}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 touch-target"
              >
                <Activity className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{isLoading ? 'Refreshing...' : 'Force Refresh'}</span>
              </button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={onClearCache}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 text-orange-600 hover:text-orange-700 touch-target"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Clear Cache</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
