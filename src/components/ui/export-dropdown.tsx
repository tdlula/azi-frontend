import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileImage, 
  FileType, 
  Image,
  Loader2,
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportDropdownProps {
  onExport: (format: 'txt' | 'pdf' | 'json' | 'png') => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  title?: string;
}

export default function ExportDropdown({
  onExport,
  disabled = false,
  loading = false,
  className,
  variant = 'outline',
  size = 'sm',
  title = 'Export'
}: ExportDropdownProps) {
  const handleExport = (format: 'txt' | 'pdf' | 'json' | 'png') => {
    onExport(format);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || loading}
          className={cn("gap-2", className)}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {title}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('txt')}
          disabled={disabled || loading}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          Text File (.txt)
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={disabled || loading}
          className="cursor-pointer"
        >
          <FileType className="w-4 h-4 mr-2" />
          PDF Document (.pdf)
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('json')}
          disabled={disabled || loading}
          className="cursor-pointer"
        >
          <FileImage className="w-4 h-4 mr-2" />
          JSON Data (.json)
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('png')}
          disabled={disabled || loading}
          className="cursor-pointer"
        >
          <Image className="w-4 h-4 mr-2" />
          Image (.png)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}