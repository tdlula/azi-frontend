import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Menu, X, Download, Share2, Palette, Sun, Moon, Camera, FileDown, Link, Copy, Activity, MessageSquare } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";
import { Link as RouterLink, useLocation } from "wouter";
import html2canvas from "html2canvas";
import ExportDropdown from "@/components/ui/export-dropdown";

interface HamburgerMenuProps {
  onScreenshot?: () => void;
  onShareUrl?: () => void;
  onCopyContent?: () => void;
  onExportData?: () => void;
  onDownloadChat?: () => void;
  onShareChat?: () => void;
}

export default function HamburgerMenu({ 
  onScreenshot, 
  onShareUrl, 
  onCopyContent, 
  onExportData,
  onDownloadChat,
  onShareChat
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleScreenshot = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        backgroundColor: theme === 'dark' ? '#003366' : '#f8fafc',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `analysis-genius-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      setIsOpen(false);
      if (onScreenshot) onScreenshot();
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const handleShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsOpen(false);
      if (onShareUrl) onShareUrl();
    } catch (error) {
      console.error('Share URL failed:', error);
    }
  };

  const handleCopyContent = () => {
    const chatContent = document.querySelector('.chat-area')?.textContent || '';
    if (chatContent) {
      navigator.clipboard.writeText(chatContent);
    }
    setIsOpen(false);
    if (onCopyContent) onCopyContent();
  };

  const handleExportData = async (format: 'txt' | 'pdf' | 'json' | 'png') => {
    try {
      switch (format) {
        case 'txt':
          await exportAsText();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'json':
          await exportAsJSON();
          break;
        case 'png':
          await handleScreenshot();
          return; // Screenshot handles its own closing
      }
      setIsOpen(false);
      if (onExportData) onExportData();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportAsText = async () => {
    const chatContent = document.querySelector('.chat-area')?.textContent || '';
    const chatLines = chatContent.split('\n').filter(line => line.trim());
    const formattedContent = chatLines.join('\n\n');
    
    const blob = new Blob([formattedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `azi-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = async () => {
    const data = {
      exportDate: new Date().toISOString(),
      platform: "Azi Analytics Platform",
      chatHistory: Array.from(document.querySelectorAll('.chat-message') || []).map((msg, index) => ({
        id: index,
        content: msg.textContent,
        timestamp: new Date().toISOString()
      })),
      pageInfo: {
        url: window.location.href,
        title: document.title,
        userAgent: navigator.userAgent
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `azi-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    try {
      const chatMessages = Array.from(document.querySelectorAll('.chat-message') || []);
      const exportData = {
        title: "Azi Analytics Export",
        content: chatMessages.map(msg => msg.textContent).join('\n\n'),
        timestamp: new Date().toISOString(),
        pageUrl: window.location.href
      };

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `azi-export-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
      await exportAsText(); // Fallback to text
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <div className="fixed top-16 sm:top-20 left-2 sm:left-4 z-50">
        <Button
          onClick={toggleMenu}
          variant="outline"
          size="icon"
          className={`
            transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md touch-target
            bg-white/10 dark:bg-black/20 backdrop-blur-sm border-sky-blue/30 
            hover:bg-sky-blue/20 hover:border-sky-blue/50 w-10 h-10 sm:w-11 sm:h-11
            ${isOpen ? 'rotate-90 scale-110' : 'hover:rotate-12'}
          `}
        >
          {isOpen ? (
            <X className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <Menu className="h-4 w-4 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* Menu Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-72 sm:w-80 z-50 transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}>
        <Card className="h-full w-full bg-background/95 backdrop-blur-lg border-r border-border shadow-2xl">
          <div className="p-4 sm:p-6 h-full flex flex-col overflow-y-auto mobile-scroll">
            {/* Header - No duplicate close button */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Menu
              </h2>
            </div>

            {/* Navigation */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Navigation
              </h3>
              <div className="space-y-2">
                <RouterLink href="/dashboard">
                  <Button
                    variant={location === '/dashboard' ? "default" : "outline"}
                    className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </RouterLink>
                <RouterLink href="/chat">
                  <Button
                    variant={location === '/chat' ? "default" : "outline"}
                    className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </RouterLink>
              </div>
            </div>

            <Separator className="my-3 sm:my-4 bg-border" />

            {/* Theme Toggle */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Appearance
              </h3>
              <Button
                onClick={toggleTheme}
                variant="outline"
                className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4 mr-2 text-bright-coral" />
                    Switch to Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2 text-midnight-blue" />
                    Switch to Dark Mode
                  </>
                )}
              </Button>
            </div>

            <Separator className="my-3 sm:my-4 bg-border" />

            {/* Download & Export */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Export & Download
              </h3>
              <div className="space-y-3">
                <ExportDropdown
                  onExport={handleExportData}
                  className="w-full touch-target text-sm"
                  variant="outline"
                  title="Export Data"
                />

                <Button
                  onClick={handleScreenshot}
                  variant="outline"
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
                >
                  <Camera className="h-4 w-4 mr-2 text-muted-foreground" />
                  Screenshot Page
                </Button>
              </div>
            </div>

            <Separator className="my-3 sm:my-4 bg-border" />

            {/* Share Options */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Share & Copy
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    if (onShareChat) onShareChat();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Share2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  Share Chat Summary
                </Button>

                <Button
                  onClick={handleShareUrl}
                  variant="outline"
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
                >
                  <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                  Copy Page URL
                </Button>
                
                <Button
                  onClick={handleCopyContent}
                  variant="outline"
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-md touch-target text-sm"
                >
                  <Copy className="h-4 w-4 mr-2 text-muted-foreground" />
                  Copy Chat Content
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 sm:pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                AZI v2.0<br />
                AI-Powered Analytics
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}