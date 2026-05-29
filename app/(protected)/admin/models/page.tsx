'use client';

import { useState } from 'react';
import { Zap, TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface MLModel {
  id: number;
  model_name: string;
  model_version: string;
  accuracy: number;
  is_active: boolean;
  training_date: string;
}

export default function ModelsPage() {
  const [models] = useState<MLModel[]>([
    {
      id: 1,
      model_name: 'XGBoost Disease Risk Predictor',
      model_version: '2.1.0',
      accuracy: 0.89,
      is_active: true,
      training_date: '2024-02-28',
    },
    {
      id: 2,
      model_name: 'XGBoost Disease Risk Predictor',
      model_version: '2.0.0',
      accuracy: 0.85,
      is_active: false,
      training_date: '2024-02-15',
    },
  ]);
  const [isRetraining, setIsRetraining] = useState(false);

  const handleRetrain = async () => {
    setIsRetraining(true);
    // Simulate training
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsRetraining(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-primary" />
            ML Models
          </h1>
          <p className="text-muted-foreground">
            Manage and train disease prediction models
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={isRetraining}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-70"
        >
          {isRetraining ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Retrain Model
            </>
          )}
        </button>
      </div>

      {/* Models List */}
      <div className="space-y-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {model.model_name}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Version: {model.model_version}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {model.training_date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(model.accuracy * 100)}%
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    model.is_active
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-gray-500/20 text-gray-600'
                  }`}
                >
                  {model.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
