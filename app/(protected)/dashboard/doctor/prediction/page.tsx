'use client';

import { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle,
  Thermometer, Droplets, Wind, ChevronDown,
  BarChart3, Info, RefreshCw, Zap
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PredictForm {
  month: number;
  rainfall_mm: number;
  avg_temp_c: number;
  max_temp_c: number;
  min_temp_c: number;
  humidity_pct: number;
  rainy_days: number;
  stagnant_water_index: number;
  mosquito_density_index: number;
  prev_month_cases: number;
}

interface PredictResult {
  predicted_cases: number;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_probability: Record<string, number>;
  confidence: number;
  interpretation: string;
  prevention_tips: string[];
  model_r2: number;
}

interface ModelMetrics {
  regressor: { mae: number; rmse: number; r2: number; cv_r2: number };
  classifier: { accuracy: number; cv_accuracy: number };
  feature_importances: Record<string, number>;
  training_rows: number;
}

const MONTH_NAMES = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const SEASONAL_TABLE = [
  { month: 'January',   rainfall:   2, humidity: 52, cases:   7, risk: 'Low'    },
  { month: 'February',  rainfall:   0, humidity: 40, cases:   4, risk: 'Low'    },
  { month: 'March',     rainfall:   8, humidity: 42, cases:   6, risk: 'Low'    },
  { month: 'April',     rainfall:  19, humidity: 48, cases:  11, risk: 'Low'    },
  { month: 'May',       rainfall:  53, humidity: 60, cases:  24, risk: 'Medium' },
  { month: 'June',      rainfall: 100, humidity: 78, cases:  53, risk: 'Medium' },
  { month: 'July',      rainfall: 189, humidity: 91, cases: 102, risk: 'High'   },
  { month: 'August',    rainfall: 161, humidity: 88, cases: 115, risk: 'High'   },
  { month: 'September', rainfall: 126, humidity: 82, cases:  89, risk: 'High'   },
  { month: 'October',   rainfall:  64, humidity: 72, cases:  55, risk: 'Medium' },
  { month: 'November',  rainfall:  19, humidity: 62, cases:  23, risk: 'Low'    },
  { month: 'December',  rainfall:   1, humidity: 52, cases:  10, risk: 'Low'    },
];

const riskBg = (r: string) =>
  r === 'High'   ? 'bg-red-50 border-red-300 text-red-800' :
  r === 'Medium' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                   'bg-emerald-50 border-emerald-300 text-emerald-800';

const riskBadge = (r: string) =>
  r === 'High'   ? 'bg-red-100 text-red-700 border border-red-200' :
  r === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                   'bg-emerald-100 text-emerald-700 border border-emerald-200';

const riskBar = (r: string) =>
  r === 'High'   ? 'bg-red-500' :
  r === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500';

const riskIcon = (r: string) =>
  r === 'High' ? '🔴' : r === 'Medium' ? '🟡' : '🟢';

const riskGlow = (r: string) =>
  r === 'High'   ? 'shadow-red-200 shadow-lg' :
  r === 'Medium' ? 'shadow-amber-200 shadow-lg' :
                   'shadow-emerald-200 shadow-lg';

export default function PredictionPage() {
  const currentMonth = new Date().getMonth() + 1;

  const [form, setForm] = useState<PredictForm>({
    month:                  currentMonth,
    rainfall_mm:            0,
    avg_temp_c:             26,
    max_temp_c:             32,
    min_temp_c:             20,
    humidity_pct:           65,
    rainy_days:             10,
    stagnant_water_index:   3,
    mosquito_density_index: 3,
    prev_month_cases:       20,
  });

  const [result,          setResult]          = useState<PredictResult | null>(null);
  const [metrics,         setMetrics]         = useState<ModelMetrics | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [error,           setError]           = useState('');
  const [showMetrics,     setShowMetrics]     = useState(false);
  const resultRef = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/predict/metrics`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMetrics(d))
      .catch(() => {});
    applyDefaults(currentMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDefaults = async (month: number) => {
    setLoadingDefaults(true);
    try {
      const res = await fetch(`${API}/api/v1/predict/defaults?month=${month}`);
      if (res.ok) {
        const d = await res.json();
        setForm(prev => ({ ...prev, month, ...d }));
      }
    } catch {}
    finally { setLoadingDefaults(false); }
  };

  const handleMonthChange = (month: number) => {
    setForm(prev => ({ ...prev, month }));
    applyDefaults(month);
    setResult(null);
    setError('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handlePredict = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        month:                  Math.round(form.month),
        rainfall_mm:            Number(form.rainfall_mm),
        avg_temp_c:             Number(form.avg_temp_c),
        max_temp_c:             Number(form.max_temp_c),
        min_temp_c:             Number(form.min_temp_c),
        humidity_pct:           Number(form.humidity_pct),
        rainy_days:             Math.round(form.rainy_days),
        stagnant_water_index:   Number(form.stagnant_water_index),
        mosquito_density_index: Number(form.mosquito_density_index),
        prev_month_cases:       Math.round(form.prev_month_cases),
      };

      const res = await fetch(`${API}/api/v1/predict/dengue`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);

      // Auto-scroll to result section smoothly
      setTimeout(() => {
        document.getElementById('prediction-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);

    } catch (err: any) {
      setError(err.message || 'Prediction failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            Dengue Outbreak Prediction
          </h1>
          <p className="text-gray-500 mt-1">
            ML model trained on 6 years of Dharwad district data (2019–2024)
          </p>
        </div>
        {metrics && (
          <button
            onClick={() => setShowMetrics(v => !v)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Model R² = {(metrics.regressor.r2 * 100).toFixed(1)}%
            <ChevronDown className={`w-4 h-4 transition-transform ${showMetrics ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* ── Metrics Panel ── */}
      {showMetrics && metrics && (
        <div className="border rounded-xl p-5 bg-blue-50 space-y-4">
          <h3 className="font-bold text-blue-800 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Model Performance (trained on {metrics.training_rows} monthly records)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="R² Score"      value={`${(metrics.regressor.r2 * 100).toFixed(1)}%`} />
            <MetricCard label="CV R²"         value={`${(metrics.regressor.cv_r2 * 100).toFixed(1)}%`} />
            <MetricCard label="MAE (cases)"   value={`±${metrics.regressor.mae}`} />
            <MetricCard label="Risk Accuracy" value={`${(metrics.classifier.cv_accuracy * 100).toFixed(1)}%`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-2">Feature Importances:</p>
            <div className="space-y-1">
              {Object.entries(metrics.feature_importances)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-48 text-gray-600 truncate">{k.replace(/_/g, ' ')}</span>
                    <div className="flex-1 bg-blue-200 rounded h-2">
                      <div className="bg-blue-600 h-2 rounded" style={{ width: `${v * 100}%` }} />
                    </div>
                    <span className="text-gray-500 w-10 text-right">{(v * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INPUT FORM ── */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-gray-800">Input Parameters</h2>
          {loadingDefaults && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading defaults...
            </span>
          )}
        </div>

        {/* Month */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
          <select
            name="month"
            value={form.month}
            onChange={e => handleMonthChange(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          >
            {MONTH_NAMES.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            Changing month auto-fills Dharwad climate averages
          </p>
        </div>

        {/* Climate inputs */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Climate Data
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <NumField icon={<Droplets className="w-3.5 h-3.5" />}    label="Rainfall (mm)"  name="rainfall_mm"  value={form.rainfall_mm}  onChange={handleChange} step={0.1} min={0} />
            <NumField icon={<Thermometer className="w-3.5 h-3.5" />} label="Avg Temp (°C)"  name="avg_temp_c"   value={form.avg_temp_c}   onChange={handleChange} step={0.1} />
            <NumField icon={<Thermometer className="w-3.5 h-3.5" />} label="Max Temp (°C)"  name="max_temp_c"   value={form.max_temp_c}   onChange={handleChange} step={0.1} />
            <NumField icon={<Thermometer className="w-3.5 h-3.5" />} label="Min Temp (°C)"  name="min_temp_c"   value={form.min_temp_c}   onChange={handleChange} step={0.1} />
            <NumField icon={<Wind className="w-3.5 h-3.5" />}        label="Humidity (%)"   name="humidity_pct" value={form.humidity_pct} onChange={handleChange} step={1} min={0} max={100} />
            <NumField icon={<Droplets className="w-3.5 h-3.5" />}    label="Rainy Days"     name="rainy_days"   value={form.rainy_days}   onChange={handleChange} step={1} min={0} max={31} />
          </div>
        </div>

        {/* Environmental sliders */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Environmental Factors
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SliderField label="Stagnant Water Index"   name="stagnant_water_index"   value={form.stagnant_water_index}   onChange={handleChange} min={0} max={10}  step={0.1} hint="0 = none  |  10 = severe" />
            <SliderField label="Mosquito Density Index" name="mosquito_density_index" value={form.mosquito_density_index} onChange={handleChange} min={0} max={10}  step={0.1} hint="Based on field trap counts" />
            <SliderField label="Previous Month Cases"   name="prev_month_cases"       value={form.prev_month_cases}       onChange={handleChange} min={0} max={200} step={1}   hint="Known dengue cases last month" />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* ── BIG PREDICT BUTTON ── */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-3 text-lg shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Analyzing data...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-white" />
              Predict Now
              <Brain className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* ── RESULT SECTION — scrolled to after prediction ── */}
      <div id="prediction-result">
        {!result && !loading && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <Brain className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium text-lg">No prediction yet</p>
            <p className="text-gray-300 text-sm mt-1">
              Fill in the parameters above and click <strong>Predict Now</strong>
            </p>
          </div>
        )}

        {loading && (
          <div className="border rounded-xl p-12 flex flex-col items-center justify-center text-center bg-blue-50">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-blue-600 font-semibold text-lg">Running ML model...</p>
            <p className="text-blue-400 text-sm mt-1">This takes under 2 seconds</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">

            {/* Top label */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Prediction Output
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">

              {/* Risk summary card */}
              <div className={`md:col-span-1 border-2 rounded-xl p-6 ${riskBg(result.risk_level)} ${riskGlow(result.risk_level)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-base">Result</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskBadge(result.risk_level)}`}>
                    {riskIcon(result.risk_level)} {result.risk_level} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <p className="text-xs opacity-60 mb-1">Predicted Cases</p>
                    <p className="text-4xl font-black">{result.predicted_cases}</p>
                    <p className="text-xs opacity-60 mt-1">this month</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <p className="text-xs opacity-60 mb-1">Confidence</p>
                    <p className="text-4xl font-black">{(result.confidence * 100).toFixed(0)}%</p>
                    <p className="text-xs opacity-60 mt-1">certainty</p>
                  </div>
                </div>

                <p className="text-xs leading-relaxed opacity-80 bg-white/40 rounded-lg p-2">
                  {result.interpretation}
                </p>
              </div>

              {/* Probability bars */}
              <div className="border rounded-xl p-5 bg-white">
                <h3 className="font-bold mb-4 text-sm text-gray-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Risk Probability
                </h3>
                {Object.entries(result.risk_probability)
                  .sort((a, b) => b[1] - a[1])
                  .map(([level, prob]) => (
                    <div key={level} className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700 flex items-center gap-1">
                          {riskIcon(level)} {level} Risk
                        </span>
                        <span className="font-bold text-gray-900">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ease-out ${riskBar(level)}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Prevention tips */}
              <div className="border rounded-xl p-5 bg-white">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-sm text-gray-700">
                  {result.risk_level === 'High'
                    ? <AlertTriangle className="w-4 h-4 text-red-500" />
                    : <CheckCircle className="w-4 h-4 text-emerald-500" />
                  }
                  Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {result.prevention_tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                      <span className="text-blue-500 shrink-0 font-bold mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}
      </div>
{/* ── Seasonal Table ── */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Dharwad Seasonal Dengue Pattern (6-year average 2019–2024)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left bg-gray-50">
                <th className="py-3 px-4 font-semibold">Month</th>
                <th className="py-3 px-4 font-semibold text-right">Rainfall</th>
                <th className="py-3 px-4 font-semibold text-right">Humidity</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Cases</th>
                <th className="py-3 px-4 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {SEASONAL_TABLE.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b transition-colors hover:bg-gray-50 ${
                    row.month === MONTH_NAMES[form.month] ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-800">{row.month}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{row.rainfall} mm</td>
                  <td className="py-3 px-4 text-right text-gray-600">{row.humidity}%</td>
                  <td className="py-3 px-4 text-right text-gray-800 font-medium">{row.cases}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${riskBadge(row.risk)}`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Climate data: KSNDMC, UAS Dharwad MARS station (1991–2024), Weather Atlas.
          Cases: Karnataka Vector Borne Disease surveillance (2019–2024).
        </p>
      </div>

    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-blue-700">{value}</p>
    </div>
  );
}

function NumField({ icon, label, name, value, onChange, step = 1, min, max }: {
  icon: React.ReactNode; label: string; name: string; value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: number; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
        {icon} {label}
      </label>
      <input
        type="number" name={name} value={value} onChange={onChange}
        step={step} min={min} max={max}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
      />
    </div>
  );
}

function SliderField({ label, name, value, onChange, min, max, step, hint }: {
  label: string; name: string; value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number; max: number; step: number; hint: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
          {value}
        </span>
      </div>
      <input
        type="range" name={name} value={value} onChange={onChange}
        min={min} max={max} step={step}
        className="w-full accent-blue-600 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min}</span>
        <span className="italic">{hint}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}