'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Activity, MapPin, AlertCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/v1/patients/stats`);

        if (!res.ok) throw new Error('Stats fetch failed');

        const statsData = await res.json();
        setStats(statsData);
      } catch (err: any) {
        setError(err.message || 'Could not load data. Make sure backend is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Loading dengue dataset...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-600 flex items-center gap-2">
      <AlertCircle className="w-5 h-5" /> {error}
    </div>
  );

  const monthly   = stats?.monthly_2024 || [];
  const ageGroups = stats?.age_groups   || [];
  const talukas   = stats?.talukas      || [];

  const maxMonth = Math.max(...monthly.map((m: any) => m.cases), 1);
  const maxAge   = Math.max(...ageGroups.map((a: any) => a.count), 1);
  const total    = stats?.total_cases || 1;

  const malePct   = ((stats?.male_count || 0) / total) * 100;
  const femalePct = ((stats?.female_count || 0) / total) * 100;

  return (
    <div className="space-y-8 p-6 animate-fade-in">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Dengue Surveillance — {stats?.disease} Dataset
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Cases" value={stats?.total_cases} />
        <StatCard icon={Users} label="Male Patients" value={stats?.male_count} />
        <StatCard icon={Users} label="Female Patients" value={stats?.female_count} />
        <StatCard icon={TrendingUp} label="Risk Trend" value={stats?.risk_trend} />
      </div>

      {/* MONTHLY CHART */}
      <div className="p-6 border rounded-xl">
        <h2 className="font-bold mb-6">Monthly Cases ({stats?.disease})</h2>

        {monthly.length === 0 ? (
          <p className="text-gray-400">No monthly data available</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {monthly.map((m: any, i: number) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className="bg-blue-500 rounded-t mx-auto"
                  style={{ height: `${(m.cases / maxMonth) * 140}px` }}
                />
                <p className="text-xs mt-1">{m.month}</p>
                <p className="text-xs text-gray-400">{m.cases}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AGE + TALUKA */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* AGE */}
        <div className="p-6 border rounded-xl">
          <h2 className="font-bold mb-4">Age Distribution</h2>

          {ageGroups.map((a: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{a.group}</span>
                <span className="font-medium">{a.count}</span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded">
                <div
                  className="bg-blue-500 h-3 rounded"
                  style={{ width: `${(a.count / maxAge) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* TALUKA */}
        <div className="p-6 border rounded-xl">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Taluka Risk
          </h2>

          {talukas.length === 0 ? (
            <p className="text-gray-400">No taluka data available</p>
          ) : (
            talukas.map((t: any, i: number) => (
              <div key={i} className="flex justify-between border-b py-2 text-sm">
                <span>{t.name}</span>
                <span className="font-bold">{t.cases}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* GENDER */}
      <div className="p-6 border rounded-xl">
        <h2 className="font-bold mb-4">Gender Distribution</h2>

        <div className="flex h-10 rounded overflow-hidden text-sm">
          <div
            className="bg-blue-500 text-white flex items-center justify-center"
            style={{ width: `${malePct}%` }}
          >
            Male ({stats?.male_count})
          </div>

          <div
            className="bg-pink-500 text-white flex items-center justify-center"
            style={{ width: `${femalePct}%` }}
          >
            Female ({stats?.female_count})
          </div>
        </div>
      </div>

      {/* NAV */}
      <div className="grid lg:grid-cols-2 gap-4">
        <NavCard href="/admin/users" title="User Management" />
        <NavCard href="/admin/models" title="ML Models" />
      </div>

    </div>
  );
}

/* ===== COMPONENTS ===== */

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value ?? 0}</p>
        </div>
        <Icon className="w-6 h-6 text-blue-500" />
      </div>
    </div>
  );
}

function NavCard({ href, title }: any) {
  return (
    <Link href={href} className="p-5 border rounded-xl hover:shadow-md block transition">
      <h3 className="font-bold">{title}</h3>
    </Link>
  );
}