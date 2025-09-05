/**
 * Target Distribution Analytics Library
 * Provides comprehensive analysis of racial equity targets and distribution patterns
 */

export interface DistributionMetrics {
  equityIndex: number;
  distributionScore: number;
  varianceThreshold: number;
  targetAlignment: number;
  diversityIndex: number;
}

export interface RaceEquityAlert {
  id: string;
  category: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: Date;
}

export interface RaceEquityAnalysis {
  metrics: DistributionMetrics;
  alerts: RaceEquityAlert[];
  trends: DistributionTrend[];
  recommendations: string[];
  timestamp: Date;
}

export interface DistributionTrend {
  category: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;
  confidence: number;
}

interface DistributionDataPoint {
  category: string;
  target: number;
  actual: number;
  variance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AnalysisConfig {
  alertThresholds: {
    variance: number;
    trend: number;
  };
  weightings: {
    equity: number;
    distribution: number;
    alignment: number;
  };
}

const DEFAULT_CONFIG: AnalysisConfig = {
  alertThresholds: {
    variance: 5.0,
    trend: 2.0,
  },
  weightings: {
    equity: 0.4,
    distribution: 0.3,
    alignment: 0.3,
  },
};

/**
 * Calculate equity index based on distribution variance
 */
function calculateEquityIndex(data: DistributionDataPoint[]): number {
  if (data.length === 0) return 0;

  const variances = data.map(d => Math.abs(d.variance));
  const maxVariance = Math.max(...variances);
  const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
  
  // Equity index decreases as variance increases
  const equityScore = Math.max(0, 100 - (avgVariance * 10 + maxVariance * 5));
  return Math.min(100, equityScore);
}

/**
 * Calculate distribution score based on how well actual matches target
 */
function calculateDistributionScore(data: DistributionDataPoint[]): number {
  if (data.length === 0) return 0;

  const alignmentScores = data.map(d => {
    const targetDiff = Math.abs(d.actual - d.target);
    return Math.max(0, 100 - (targetDiff * 5));
  });

  return alignmentScores.reduce((sum, score) => sum + score, 0) / alignmentScores.length;
}

/**
 * Calculate variance threshold for alerting
 */
function calculateVarianceThreshold(data: DistributionDataPoint[]): number {
  if (data.length === 0) return 5.0;

  const variances = data.map(d => Math.abs(d.variance));
  const stdDev = Math.sqrt(
    variances.reduce((sum, v) => {
      const mean = variances.reduce((s, val) => s + val, 0) / variances.length;
      return sum + Math.pow(v - mean, 2);
    }, 0) / variances.length
  );

  return Math.max(3.0, Math.min(10.0, stdDev * 2));
}

/**
 * Calculate target alignment score
 */
function calculateTargetAlignment(data: DistributionDataPoint[]): number {
  if (data.length === 0) return 0;

  const totalTarget = data.reduce((sum, d) => sum + d.target, 0);
  const totalActual = data.reduce((sum, d) => sum + d.actual, 0);
  
  if (totalTarget === 0) return 0;
  
  const overallVariance = Math.abs(totalActual - totalTarget) / totalTarget * 100;
  return Math.max(0, 100 - overallVariance * 5);
}

/**
 * Calculate diversity index using Shannon diversity index
 */
function calculateDiversityIndex(data: DistributionDataPoint[]): number {
  if (data.length === 0) return 0;

  const total = data.reduce((sum, d) => sum + d.actual, 0);
  if (total === 0) return 0;

  const proportions = data.map(d => d.actual / total);
  const shannonIndex = -proportions.reduce((sum, p) => {
    return p > 0 ? sum + (p * Math.log(p)) : sum;
  }, 0);

  // Normalize to 0-100 scale
  const maxPossibleIndex = Math.log(data.length);
  return maxPossibleIndex > 0 ? (shannonIndex / maxPossibleIndex) * 100 : 0;
}

/**
 * Generate alerts based on distribution analysis
 */
function generateAlerts(
  data: DistributionDataPoint[], 
  metrics: DistributionMetrics,
  config: AnalysisConfig = DEFAULT_CONFIG
): RaceEquityAlert[] {
  const alerts: RaceEquityAlert[] = [];

  // Check for high variance in categories
  data.forEach((item, index) => {
    if (Math.abs(item.variance) > config.alertThresholds.variance) {
      const severity: 'low' | 'medium' | 'high' = 
        Math.abs(item.variance) > 10 ? 'high' : 
        Math.abs(item.variance) > 7 ? 'medium' : 'low';

      alerts.push({
        id: `variance-${index}`,
        category: item.category,
        message: `Distribution variance of ${item.variance.toFixed(1)}% exceeds threshold`,
        severity,
        recommendation: item.variance > 0 
          ? 'Consider measures to reduce over-representation'
          : 'Implement strategies to increase representation',
        timestamp: new Date(),
      });
    }
  });

  // Check overall equity index
  if (metrics.equityIndex < 70) {
    alerts.push({
      id: 'equity-low',
      category: 'Overall Equity',
      message: `Equity index of ${metrics.equityIndex.toFixed(1)} is below acceptable threshold`,
      severity: metrics.equityIndex < 50 ? 'high' : 'medium',
      recommendation: 'Review distribution targets and implement corrective measures',
      timestamp: new Date(),
    });
  }

  // Check distribution score
  if (metrics.distributionScore < 75) {
    alerts.push({
      id: 'distribution-low',
      category: 'Distribution Alignment',
      message: `Distribution score of ${metrics.distributionScore.toFixed(1)} indicates poor target alignment`,
      severity: metrics.distributionScore < 60 ? 'high' : 'medium',
      recommendation: 'Adjust targets or improve distribution mechanisms',
      timestamp: new Date(),
    });
  }

  return alerts;
}

/**
 * Analyze distribution trends
 */
function analyzeTrends(data: DistributionDataPoint[]): DistributionTrend[] {
  return data.map(item => {
    // Calculate confidence based on variance stability
    const confidence = Math.max(0.1, 1 - (Math.abs(item.variance) / 20));
    
    // Calculate rate based on trend direction and variance
    let rate = 0;
    if (item.trend === 'increasing') {
      rate = Math.max(0.5, Math.min(5.0, Math.abs(item.variance) * 0.3));
    } else if (item.trend === 'decreasing') {
      rate = -Math.max(0.5, Math.min(5.0, Math.abs(item.variance) * 0.3));
    }

    return {
      category: item.category,
      direction: item.trend,
      rate,
      confidence,
    };
  });
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  data: DistributionDataPoint[],
  metrics: DistributionMetrics,
  alerts: RaceEquityAlert[]
): string[] {
  const recommendations: string[] = [];

  // General recommendations based on metrics
  if (metrics.equityIndex < 80) {
    recommendations.push('Implement targeted outreach programs for underrepresented groups');
  }

  if (metrics.distributionScore < 85) {
    recommendations.push('Review and adjust distribution targets based on current data');
  }

  if (metrics.diversityIndex < 70) {
    recommendations.push('Develop strategies to increase overall diversity');
  }

  // Category-specific recommendations
  const highVarianceCategories = data.filter(d => Math.abs(d.variance) > 5);
  if (highVarianceCategories.length > 0) {
    recommendations.push(`Focus on balancing representation in: ${highVarianceCategories.map(c => c.category).join(', ')}`);
  }

  // Alert-based recommendations
  if (alerts.filter(a => a.severity === 'high').length > 0) {
    recommendations.push('Address high-priority distribution issues immediately');
  }

  // Trend-based recommendations
  const decliningCategories = data.filter(d => d.trend === 'decreasing');
  if (decliningCategories.length > 0) {
    recommendations.push(`Investigate declining trends in: ${decliningCategories.map(c => c.category).join(', ')}`);
  }

  return recommendations;
}

/**
 * Main analysis function
 */
export async function analyzeTargetDistribution(
  data: DistributionDataPoint[],
  timeframe: string = '30d',
  config: AnalysisConfig = DEFAULT_CONFIG
): Promise<RaceEquityAnalysis> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid or empty distribution data provided');
  }

  // Calculate metrics
  const metrics: DistributionMetrics = {
    equityIndex: calculateEquityIndex(data),
    distributionScore: calculateDistributionScore(data),
    varianceThreshold: calculateVarianceThreshold(data),
    targetAlignment: calculateTargetAlignment(data),
    diversityIndex: calculateDiversityIndex(data),
  };

  // Generate alerts
  const alerts = generateAlerts(data, metrics, config);

  // Analyze trends
  const trends = analyzeTrends(data);

  // Generate recommendations
  const recommendations = generateRecommendations(data, metrics, alerts);

  return {
    metrics,
    alerts,
    trends,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Export utility functions for advanced usage
 */
export const AnalyticsUtils = {
  calculateEquityIndex,
  calculateDistributionScore,
  calculateVarianceThreshold,
  calculateTargetAlignment,
  calculateDiversityIndex,
  generateAlerts,
  analyzeTrends,
  generateRecommendations,
};

/**
 * Export default configuration
 */
export { DEFAULT_CONFIG };