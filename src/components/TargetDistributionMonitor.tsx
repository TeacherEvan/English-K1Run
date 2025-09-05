import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WaveTriangle, ChartBar, ArrowClockwise, TrendUp, TrendDown } from '@phosphor-icons/react';
import { analyzeTargetDistribution, DistributionMetrics, RaceEquityAnalysis } from '@/lib/target-distribution-analytics';

interface TargetDistributionMonitorProps {
  className?: string;
  onAnalysisUpdate?: (analysis: RaceEquityAnalysis) => void;
}

interface DistributionData {
  category: string;
  target: number;
  actual: number;
  variance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function TargetDistributionMonitor({ 
  className, 
  onAnalysisUpdate 
}: TargetDistributionMonitorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<RaceEquityAnalysis | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [metrics, setMetrics] = useState<DistributionMetrics | null>(null);

  const mockDistributionData: DistributionData[] = [
    { category: 'Asian', target: 25, actual: 22, variance: -3, trend: 'stable' },
    { category: 'Black', target: 20, actual: 18, variance: -2, trend: 'increasing' },
    { category: 'Hispanic', target: 30, actual: 35, variance: 5, trend: 'increasing' },
    { category: 'White', target: 20, actual: 21, variance: 1, trend: 'stable' },
    { category: 'Other', target: 5, actual: 4, variance: -1, trend: 'decreasing' },
  ];

  useEffect(() => {
    setDistributionData(mockDistributionData);
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeTargetDistribution(distributionData, selectedTimeframe);
      setAnalysisResults(analysis);
      setMetrics(analysis.metrics);
      onAnalysisUpdate?.(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-red-600';
    if (variance > 2) return 'text-orange-600';
    if (variance < -5) return 'text-red-600';
    if (variance < -2) return 'text-orange-600';
    return 'text-green-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="h-5 w-5" />
                Target Distribution Monitor
              </CardTitle>
              <CardDescription>
                Monitor racial equity targets and distribution patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                size="sm"
              >
                <ArrowClockwise className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Analyze
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{metrics.equityIndex.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Equity Index</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{metrics.distributionScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Distribution Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{metrics.varianceThreshold.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Variance Threshold</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Distribution Analysis</h3>
            {distributionData.map((item) => (
              <div key={item.category} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.category}</span>
                    {getTrendIcon(item.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={Math.abs(item.variance) > 3 ? 'destructive' : 'secondary'}>
                      {item.variance > 0 ? '+' : ''}{item.variance}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target: {item.target}%</span>
                    <span>Actual: {item.actual}%</span>
                  </div>
                  <Progress value={item.actual} className="h-2" />
                </div>
              </div>
            ))}
          </div>

          {analysisResults && analysisResults.alerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Alerts</h3>
              {analysisResults.alerts.map((alert, index) => (
                <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                  <WaveTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{alert.category}:</strong> {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}