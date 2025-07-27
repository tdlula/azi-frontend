import { Button } from "@/components/ui/button";
import { BarChart3, Settings } from "lucide-react";
import NetworkHealthIcon from "@/components/NetworkHealthIcon";
import { Link, useLocation } from "wouter";
import { useAppConfig } from "@/hooks/useAppConfig";

export default function AppHeader() {
  const [location] = useLocation();
  const { isAdminEnabled } = useAppConfig();

  return (
    <div className="bg-card border-b border-border p-3 sm:p-4 shadow-xl">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary flex-shrink-0">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight truncate">AZI</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Professional Data Analytics Platform</p>
            </div>
          </div>


        </div>

        {/* Center - Navigation Links */}
        <div className="flex items-center gap-2">
          {/* Conditionally show Settings button based on admin configuration */}
          {isAdminEnabled && (
            <Link href="/settings">
              <Button 
                variant={location === "/settings" ? "default" : "ghost"} 
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right side - Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Network Health Icon */}
          <NetworkHealthIcon />
        </div>
      </div>
    </div>
  );
}