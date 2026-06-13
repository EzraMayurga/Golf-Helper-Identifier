import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getApiBase } from '@/lib/apiConfig';

export default function PredictPage() {
  const [features, setFeatures] = useState<Record<string, any>>({});
  const [metrics, setMetrics] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = getApiBase();
    fetch(`${apiBase}/api/model-metrics`)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setMetrics(j.metrics);
          const cols = j.metrics.feature_columns || [];
          const init: Record<string, any> = {};
          cols.forEach((c: string) => init[c] = 0);
          setFeatures(init);
          setError(null);
        } else {
          setError('Failed to load model metrics');
        }
      })
      .catch((e) => setError(`Error loading metrics: ${e.message}`));
  }, []);

  function setVal(k: string, v: any) {
    setFeatures(s => ({ ...s, [k]: v }));
  }

  function submit() {
    const apiBase = getApiBase();
    setLoading(true);
    setResult(null);
    fetch(`${apiBase}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    })
      .then(r => r.json())
      .then(j => {
        setResult(j);
        setError(j.success ? null : (j.message || 'Prediction failed'));
      })
      .catch(e => {
        setError(`Error: ${e.message}`);
        setResult(null);
      })
      .finally(() => setLoading(false));
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading features...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const featureGroups = {
    'Basic Info': ['Unnamed: 0', 'id', 'slow'],
    'Player Profile': ['sex', 'view'],
    'Event Features': ['events_count', 'events_mean', 'events_min', 'events_max', 'events_std'],
    'Bounding Box': ['bbox_w', 'bbox_h', 'bbox_area', 'bbox_aspect_ratio']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Golf Club Prediction</CardTitle>
            <CardDescription>
              Enter swing parameters to predict the club used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {Object.entries(featureGroups).map(([groupName, cols]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    {groupName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cols.map((c: string) => (
                      <div key={c} className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 capitalize">
                          {c.replace(/_/g, ' ')}
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={features[c] ?? 0}
                          onChange={(e) =>
                            setVal(c, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                onClick={submit}
                disabled={loading}
                className="w-full h-10 text-base"
              >
                {loading ? 'Predicting...' : 'Predict Club'}
              </Button>
            </div>

            {result && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-4">Prediction Result</h3>
                {result.success ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">Predicted Club</p>
                      <p className="text-2xl font-bold text-green-900">
                        {result.prediction}
                      </p>
                    </div>
                    {result.probabilities && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Confidence Scores</p>
                        <div className="space-y-2">
                          {Object.entries(result.probabilities).map(([club, prob]: [string, any]) => (
                            <div key={club} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{club}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(prob * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-600 w-12 text-right">
                                  {(prob * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {result.message || 'Prediction failed'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
