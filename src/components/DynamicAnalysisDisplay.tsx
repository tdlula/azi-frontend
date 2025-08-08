import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Utility to prettify key names
function prettifyKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase());
}

// Recursively render any value
function renderValue(value: any, depth = 0) {
  if (value == null) return <span className="text-muted-foreground">N/A</span>;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{value.toString()}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <ul className="list-disc pl-4 space-y-1">
        {value.map((item, idx) => (
          <li key={idx}>{renderValue(item, depth + 1)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className={`space-y-2 ml-${depth * 2}`}> {/* Indent nested objects */}
        {Object.entries(value).map(([k, v], idx) => (
          <div key={k + idx}>
            <span className="font-medium text-sm mr-2">{prettifyKey(k)}:</span>
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

interface DynamicAnalysisDisplayProps {
  data: Record<string, any>;
  title?: string;
  description?: string;
}

const DynamicAnalysisDisplay: React.FC<DynamicAnalysisDisplayProps> = ({ data, title = "Analysis Results", description = "Automatically formatted analysis from backend data." }) => {
  if (!data || typeof data !== "object") {
    return <Card><CardContent>Invalid analysis data.</CardContent></Card>;
  }
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="mb-4">
            <Badge variant="outline" className="mb-2">{prettifyKey(key)}</Badge>
            <div>{renderValue(value)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DynamicAnalysisDisplay;
