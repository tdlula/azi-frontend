import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentItem {
  text: string;
  score: number;
  confidence: number;
}

interface SentimentTableData {
  positiveItems: SentimentItem[];
  negativeItems: SentimentItem[];
  neutralItems: SentimentItem[];
  overallSentiment: number;
  confidenceScore: number;
}

interface SentimentTableProps {
  data: SentimentTableData;
}

export default function SentimentTable({ data }: SentimentTableProps) {
  const getSentimentColor = (score: number) => {
    if (score > 0.1) return "text-green-600 dark:text-green-400";
    if (score < -0.1) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (score < -0.1) return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
  };

  const getSentimentBadge = (score: number) => {
    if (score > 0.1) return <Badge variant="outline" className="text-green-600 border-green-600">Positive</Badge>;
    if (score < -0.1) return <Badge variant="outline" className="text-red-600 border-red-600">Negative</Badge>;
    return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Neutral</Badge>;
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + "%";
  };

  const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(0) + "%";
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSentimentIcon(data.overallSentiment)}
            Sentiment Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Sentiment</p>
              <p className={`text-lg font-semibold ${getSentimentColor(data.overallSentiment)}`}>
                {formatScore(data.overallSentiment)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-lg font-semibold text-foreground">
                {formatConfidence(data.confidenceScore)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positive Sentiments */}
        {data.positiveItems && data.positiveItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="w-5 h-5" />
                Positive Sentiments ({data.positiveItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.positiveItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.text}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {formatScore(item.score)}
                      </TableCell>
                      <TableCell>{formatConfidence(item.confidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Negative Sentiments */}
        {data.negativeItems && data.negativeItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <TrendingDown className="w-5 h-5" />
                Negative Sentiments ({data.negativeItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.negativeItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.text}</TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {formatScore(item.score)}
                      </TableCell>
                      <TableCell>{formatConfidence(item.confidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Neutral Sentiments */}
        {data.neutralItems && data.neutralItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Minus className="w-5 h-5" />
                Neutral Sentiments ({data.neutralItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.neutralItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.text}</TableCell>
                      <TableCell className="text-yellow-600 dark:text-yellow-400">
                        {formatScore(item.score)}
                      </TableCell>
                      <TableCell>{formatConfidence(item.confidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}