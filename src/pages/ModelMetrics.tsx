import React, { useEffect, useState } from 'react';
import { getApiBase } from '@/lib/apiConfig';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Metrics = {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  per_class: Record<string, { precision: number; recall: number; f1: number; support: number }>;
  labels: string[];
  confusion_matrix: number[][];
  n_train?: number;
  n_test?: number;
  feature_columns?: string[];
};

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const apiBase = getApiBase();
        console.log('Fetching metrics from:', `${apiBase}/api/model-metrics`);
        
        const response = await fetch(`${apiBase}/api/model-metrics`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
          setError(null);
        } else {
          throw new Error(data.message || 'Invalid metrics response');
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error('Failed to fetch metrics:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="text-gold" /> Model Metrics
        </h1>
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="mt-4 text-muted-foreground">Loading model metrics...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="text-gold" /> Model Metrics
        </h1>
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Error loading metrics:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="text-gold" /> Model Metrics
        </h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No metrics available yet. Train a model first.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold flex items-center gap-2">
        <TrendingUp className="text-gold" /> Model Metrics
      </h1>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Accuracy</p>
          <p className="text-2xl font-bold text-gold">{(metrics.accuracy * 100).toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Macro F1</p>
          <p className="text-2xl font-bold text-gold">{metrics.macro_f1.toFixed(3)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Training Samples</p>
          <p className="text-2xl font-bold">{metrics.n_train || 'N/A'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Test Samples</p>
          <p className="text-2xl font-bold">{metrics.n_test || 'N/A'}</p>
        </Card>
      </div>

      {/* Per-Class Metrics */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Per-Class Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Class</th>
                <th className="text-center py-2 px-2">Precision</th>
                <th className="text-center py-2 px-2">Recall</th>
                <th className="text-center py-2 px-2">F1-Score</th>
                <th className="text-center py-2 px-2">Support</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.per_class).map(([label, vals]) => (
                <tr key={label} className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium capitalize">{label}</td>
                  <td className="text-center py-2 px-2">{vals.precision.toFixed(3)}</td>
                  <td className="text-center py-2 px-2">{vals.recall.toFixed(3)}</td>
                  <td className="text-center py-2 px-2 font-semibold text-gold">{vals.f1.toFixed(3)}</td>
                  <td className="text-center py-2 px-2">{vals.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confusion Matrix */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Confusion Matrix</h2>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <td className="p-2 font-bold">Predicted →</td>
                {metrics.labels.map((label) => (
                  <th key={label} className="p-2 text-center font-bold text-sm capitalize">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.confusion_matrix.map((row, idx) => (
                <tr key={idx}>
                  <th className="p-2 text-right font-bold text-sm capitalize">{metrics.labels[idx]}</th>
                  {row.map((value, colIdx) => {
                    const isCorrect = idx === colIdx;
                    return (
                      <td 
                        key={colIdx} 
                        className={`p-2 text-center font-semibold text-sm ${
                          isCorrect 
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                            : 'bg-red-500/10 text-foreground'
                        }`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Rows represent actual classes, columns represent predicted classes. Green cells = correct predictions.
        </p>
      </Card>
    </div>
  );
}
