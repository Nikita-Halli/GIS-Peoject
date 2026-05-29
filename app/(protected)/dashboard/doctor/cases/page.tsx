'use client';

import { useState, useEffect } from 'react';
import { Activity, Plus, Search, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { Brain } from 'lucide-react';
// inside your nav links array:

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
interface Patient {
  id: number;
  patient_name: string;
  age: string;
  sex: string;
  doa: string;
  taluka: string;
  district: string;
  disease: string;
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

export default function CasesPage() {
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState('');
  const [searchTerm, setSearchTerm]   = useState('');
  const [sexFilter, setSexFilter]     = useState('');
  const [yearFilter, setYearFilter]   = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availableYears, setAvailableYears]   = useState<string[]>([]);

  // Modal state
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState<NewPatientForm>(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, sexFilter, yearFilter]);

  // Fetch available years from stats once
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res  = await fetch(`${API}/api/v1/patients/stats`);
        if (!res.ok) return;
        const data = await res.json();
        const months: { month: string }[] = data.monthly_2024 || [];
        // Extract unique years from all patients via separate call
        const allRes  = await fetch(`${API}/api/v1/patients/list?page=1&limit=99999`);
        if (!allRes.ok) return;
        const allData = await allRes.json();
        const years = Array.from(
          new Set<string>(
            (allData.patients as Patient[])
              .map(p => {
                const s = String(p.doa);
                // support dd/mm/yyyy, yyyy-mm-dd, dd-mm-yyyy
                const match =
                  s.match(/(\d{4})/) ;
                return match ? match[1] : null;
              })
              .filter(Boolean) as string[]
          )
        ).sort((a, b) => Number(b) - Number(a));
        setAvailableYears(years);
      } catch {
        // silently fail; year dropdown will be empty
      }
    };
    fetchYears();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sexFilter)       params.append('sex', sexFilter);
      if (yearFilter)      params.append('year', yearFilter);

      const res = await fetch(`${API}/api/v1/patients/list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatients(data.patients || []);
      setTotalPages(data.pages   || 1);
      setTotal(data.total        || 0);
    } catch {
      setError('Could not load patients. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [page, debouncedSearch, sexFilter, yearFilter]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!form.patient_name.trim() || !form.age.trim() || !form.sex || !form.doa) {
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
      setSubmitSuccess(`Patient "${result.patient_name || form.patient_name}" reported successfully!`);
      setForm(EMPTY_FORM);

      // Refresh table
      await fetchPatients();

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

  const closeModal = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSubmitError('');
    setSubmitSuccess('');
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Activity className="w-8 h-8 text-primary" />
            Disease Cases
          </h1>
          <p className="text-muted-foreground">
            {total} dengue cases from Dharwad District dataset
          </p>
        </div>

        <button
          onClick={() => { setShowForm(true); setSubmitError(''); setSubmitSuccess(''); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Report Case
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={sexFilter}
          onChange={e => setSexFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Years</option>
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['#', 'Patient Name', 'Age', 'Sex', 'Date of Admission', 'Taluka', 'Disease', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((p, i) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{p.patient_name}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{p.age}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.sex?.toLowerCase().includes('female')
                          ? 'bg-pink-500/20 text-pink-600'
                          : 'bg-blue-500/20 text-blue-600'
                      }`}>
                        {p.sex}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.doa}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.taluka && p.taluka.toLowerCase() !== 'none' ? p.taluka : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-600">
                        {p.disease}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                        Reported
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-border flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} — {total} total patients
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-muted transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Case Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <h2 className="text-xl font-bold">Report New Case</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition">
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

              <FormField label="Patient Name *"  name="patient_name" value={form.patient_name} onChange={handleChange} placeholder="Full name" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Age *" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 35" />
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

              <FormField label="Address"  name="address"  value={form.address}  onChange={handleChange} placeholder="Street address" />
              <FormField label="Taluka"   name="taluka"   value={form.taluka}   onChange={handleChange} placeholder="e.g. Dharwad" />
              <FormField label="District" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Dharwad" />
              <FormField label="State"    name="state"    value={form.state}    onChange={handleChange} placeholder="e.g. Karnataka" />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Add Case'}
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}

function FormField({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string;
}) {
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