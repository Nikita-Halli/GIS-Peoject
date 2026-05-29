'use client';

import { useAuth } from '@/app/context/auth-context';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, Activity, MapPin, Plus, X, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Patient {
  id: number;
  patient_name: string;
  age: string;
  sex: string;
  doa: string;
  taluka?: string;
  district?: string;
  disease: string;
}

interface Stats {
  total_cases: number;
  male_count: number;
  female_count: number;
  risk_trend: string;
  disease: string;
  age_groups: { group: string; count: number }[];
  talukas: { name: string; cases: number }[];
}

interface NewPatientForm {
  patient_name: string;
  age: string;
  sex: string;
  doa: string;
  address: string;
  taluka: string;
  district: string;
  state: string;
}

const EMPTY_FORM: NewPatientForm = {
  patient_name: '',
  age: '',
  sex: '',
  doa: '',
  address: '',
  taluka: '',
  district: '',
  state: '',
};

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [stats, setStats]         = useState<Stats | null>(null);
  const [recent, setRecent]       = useState<Patient[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<NewPatientForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch(`${API}/api/v1/patients/stats`),
        fetch(`${API}/api/v1/patients/recent?limit=20`),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!recentRes.ok) throw new Error('Failed to fetch recent patients');

      const statsData  = await statsRes.json();
      const recentData = await recentRes.json();

      setStats(statsData);
      setRecent(recentData.cases || recentData.patients || []);
    } catch (err: any) {
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!form.patient_name || !form.age || !form.sex || !form.doa) {
      setSubmitError('Name, Age, Sex and Date of Admission are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/patients/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const result = await res.json();
      setSubmitSuccess(`Patient "${result.patient_name || form.patient_name}" added successfully!`);
      setForm(EMPTY_FORM);

      // Refresh dashboard data
      await fetchData();

      // Auto-close form after 2s
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess('');
      }, 2000);

    } catch (err: any) {
      setSubmitError(err.message || 'Failed to add patient.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-6 text-center text-gray-500">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 text-center">{error}</div>
  );

  const ageGroups = stats?.age_groups || [];
  const maxAge    = Math.max(...ageGroups.map(a => a.count), 1);
  const total     = stats?.total_cases || 1;
  const malePct   = ((stats?.male_count   || 0) / total) * 100;
  const femalePct = ((stats?.female_count || 0) / total) * 100;

  return (
    <div className="space-y-8 p-6">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.full_name || 'Doctor'}
          </h1>
          <p className="text-gray-500">
            {stats?.disease} Disease Surveillance Dashboard
          </p>
        </div>

        <button
          onClick={() => { setShowForm(true); setSubmitError(''); setSubmitSuccess(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow"
        >
          <Plus className="w-4 h-4" />
          Report New Patient
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Activity}   label="Total Cases"    value={stats?.total_cases} color="blue" />
        <StatCard icon={Users}      label="Male Patients"  value={stats?.male_count}  color="blue" />
        <StatCard icon={Users}      label="Female Patients" value={stats?.female_count} color="pink" />
      </div>

      {/* AGE DISTRIBUTION */}
      <div className="p-6 border rounded-xl">
        <h2 className="font-bold mb-4 text-lg">Age Distribution</h2>
        {ageGroups.length === 0 ? (
          <p className="text-gray-400">No age data available</p>
        ) : (
          ageGroups.map((a, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{a.group}</span>
                <span className="font-medium">{a.count}</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded">
                <div
                  className="bg-blue-500 h-3 rounded transition-all duration-500"
                  style={{ width: `${(a.count / maxAge) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* GENDER BAR */}
      <div className="p-6 border rounded-xl">
        <h2 className="font-bold mb-4 text-lg">Gender Distribution</h2>
        <div className="flex h-10 rounded overflow-hidden text-sm font-medium">
          {malePct > 0 && (
            <div
              className="bg-blue-500 text-white flex items-center justify-center transition-all duration-500"
              style={{ width: `${malePct}%` }}
            >
              Male ({stats?.male_count})
            </div>
          )}
          {femalePct > 0 && (
            <div
              className="bg-pink-500 text-white flex items-center justify-center transition-all duration-500"
              style={{ width: `${femalePct}%` }}
            >
              Female ({stats?.female_count})
            </div>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Male — {malePct.toFixed(1)}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-pink-500 rounded-sm inline-block" /> Female — {femalePct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* RECENT PATIENTS — 20 */}
      <div className="p-6 border rounded-xl">
        <h2 className="text-lg font-bold mb-3">
          Recent {stats?.disease} Patients
          <span className="ml-2 text-sm font-normal text-gray-400">(latest 20)</span>
        </h2>

        {recent.length === 0 ? (
          <p className="text-gray-400">No recent cases found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-left">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Age</th>
                  <th className="py-2 pr-4">Sex</th>
                  <th className="py-2 pr-4">DOA</th>
                  <th className="py-2 pr-4">Taluka</th>
                  <th className="py-2">Disease</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 20).map((p, i) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{p.patient_name}</td>
                    <td className="py-2 pr-4">{p.age}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.sex?.toLowerCase().includes('female')
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.sex}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{p.doa}</td>
                    <td className="py-2 pr-4 text-gray-500">{p.taluka || '—'}</td>
                    <td className="py-2">
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {p.disease}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PATIENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <h2 className="text-xl font-bold">Report New Patient</h2>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSubmitError(''); setSubmitSuccess(''); }}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">

              {submitSuccess && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">
                  <CheckCircle className="w-4 h-4" /> {submitSuccess}
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              <Field label="Patient Name *" name="patient_name" value={form.patient_name} onChange={handleChange} placeholder="Full name" />
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age *" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 35" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    name="sex"
                    value={form.sex}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Admission *</label>
                <input
                  type="date"
                  name="doa"
                  value={form.doa}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Field label="Address"  name="address"  value={form.address}  onChange={handleChange} placeholder="Street address" />
              <Field label="Taluka"   name="taluka"   value={form.taluka}   onChange={handleChange} placeholder="e.g. Dharwad" />
              <Field label="District" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Dharwad" />
              <Field label="State"    name="state"    value={form.state}    onChange={handleChange} placeholder="e.g. Karnataka" />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setSubmitError(''); setSubmitSuccess(''); }}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Add Patient'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Small reusable components ─── */

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600',
    pink: 'bg-pink-50 text-pink-600',
  };
  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value ?? 0}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color] || 'bg-gray-100 text-gray-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}