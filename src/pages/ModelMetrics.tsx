import React, { useEffect, useState } from 'react';
import { getApiBase } from '@/lib/apiConfig';

type Metrics = {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  per_class: Record<string, { precision: number; recall: number; f1: number; support: number }>;
  labels: string[];
  confusion_matrix: number[][];
  n_train: number;
  n_test: number;
};

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = getApiBase();
    fetch(`${apiBase}/api/model-metrics`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setMetrics(j.metrics);
        } else {
          setError(j.message || 'No metrics');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading model metrics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!metrics) return <div>No metrics available.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Model Metrics</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>Train size: {metrics.n_train}</div>
        <div>Test size: {metrics.n_test}</div>
        <div>Accuracy: {metrics.accuracy.toFixed(3)}</div>
        <div>Macro F1: {metrics.macro_f1.toFixed(3)}</div>
      </div>

      <h3 className="font-semibold mt-4">Per-class</h3>
      <table className="w-full text-sm mt-2 border-collapse">
        <thead>
          <tr>
            <th className="text-left">Label</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>F1</th>
            <th>Support</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metrics.per_class).map(([label, vals]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{vals.precision.toFixed(3)}</td>
              <td>{vals.recall.toFixed(3)}</td>
              <td>{vals.f1.toFixed(3)}</td>
              <td>{vals.support}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="font-semibold mt-4">Confusion Matrix</h3>
      <div className="overflow-auto mt-2">
        <table className="border-collapse">
          <thead>
            <tr>
              <th></th>
              {metrics.labels.map((l) => (
                <th key={l} className="px-2">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.confusion_matrix.map((row, i) => (
              <tr key={i}>
                <td className="font-medium pr-2">{metrics.labels[i]}</td>
                {row.map((v, j) => (
                  <td key={j} className="px-2 text-center">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
