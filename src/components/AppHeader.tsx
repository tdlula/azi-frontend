import { Button } from "@/components/ui/button";
import { BarChart3, Settings } from "lucide-react";
import NetworkHealthIcon from "@/components/NetworkHealthIcon";
import AuthHeader from "@/components/AuthHeader";
import { Link, useLocation } from "wouter";
import { useAppConfig } from "@/hooks/useAppConfig";

export default function AppHeader() {
  const [location] = useLocation();
  const { isAdminEnabled } = useAppConfig();

  return (
    <div className="bg-card border-b border-border p-2 sm:p-3 md:p-4 shadow-xl">
      <div className="flex items-center justify-between max-w-full">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <div className="p-1 sm:p-1.5 md:p-2 rounded-lg bg-primary flex-shrink-0">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-bold text-foreground tracking-tight truncate">AZI</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Professional Data Analytics Platform</p>
            </div>
          </div>
        </div>

        {/* Center - Navigation Links (Hidden on mobile to save space) */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Conditionally show Settings button based on admin configuration */}
          {isAdminEnabled && (
            <Link href="/settings">
              <Button 
                variant={location === "/settings" ? "default" : "ghost"} 
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm touch-target"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right side - Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Network Health Icon */}
          <div className="hidden sm:block">
            <NetworkHealthIcon />
          </div>
          
          {/* Mobile Settings Link */}
          {isAdminEnabled && (
            <div className="sm:hidden">
              <Link href="/settings">
                <Button 
                  variant={location === "/settings" ? "default" : "ghost"} 
                  size="sm"
                  className="p-2 touch-target"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
          
          {/* Authentication Header */}
          <AuthHeader />
        </div>
      </div>
    </div>
  );
}