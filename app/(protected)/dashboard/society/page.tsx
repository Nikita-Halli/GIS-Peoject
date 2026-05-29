'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, AlertCircle, BarChart3, MapPin, Calendar } from 'lucide-react';

export default function SocietyDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/patients/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Could not load data. Make sure backend is running on port 8000.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading real dataset...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-12">
      <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    </div>
  );

  const maxMonthly = Math.max(...(stats?.monthly_2024?.map((m: any) => m.cases) || [1]));
  const maxAge = Math.max(...(stats?.age_groups?.map((a: any) => a.count) || [1]));

  // Generate alerts from real data
  const alerts = [
    { id: 1, message: `High dengue activity in Dharwad — ${stats?.total_cases} total cases recorded`, risk_level: 'critical', date: '2024-07-01' },
    { id: 2, message: `Peak month July 2024 recorded ${stats?.this_month} cases — highest in dataset`, risk_level: 'critical', date: '2024-07-31' },
    { id: 3, message: `Age group 11-20 most affected — ${stats?.age_groups?.find((a: any) => a.group === '11-20')?.count || 0} cases`, risk_level: 'high', date: '2024-06-15' },
    { id: 4, message: `Male patients (${stats?.male_count}) outnumber female (${stats?.female_count}) in Dharwad district`, risk_level: 'medium', date: '2024-05-01' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Public Health Dashboard</h1>
        <p className="text-muted-foreground">
          Dengue Surveillance — Dharwad District, Karnataka | Real Patient Data
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: 'Total Cases Reported', value: stats?.total_cases, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: Users, label: 'Population Affected', value: stats?.total_cases, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { icon: Calendar, label: 'Peak Month (Jul 2024)', value: stats?.this_month, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: AlertCircle, label: 'Active Alerts', value: stats?.active_alerts, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-6 animate-slide-in-from-bottom"
            style={{ animationDelay: `${idx * 50}ms` }}>
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Monthly Disease Trend — 2024 (Real Data)</h2>
        <div className="flex items-end gap-2 h-40">
          {stats?.monthly_2024?.map((m: any) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{m.cases}</span>
              <div className="w-full bg-gradient-to-t from-primary to-accent rounded-t hover:opacity-80 transition-opacity"
                style={{ height: `${(m.cases / maxMonthly) * 130}px` }}></div>
              <span className="text-xs text-muted-foreground">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease Breakdown - Real Data */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Age Group Breakdown (Real Data)</h2>
          <div className="space-y-4">
            {stats?.age_groups?.map((a: any) => (
              <div key={a.group}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-foreground">Age {a.group}</p>
                  <span className="text-sm font-bold text-primary">{a.count} cases</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                    style={{ width: `${(a.count / maxAge) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Areas - Real Talukas */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">High Risk Areas (Real Data)</h2>
          <div className="space-y-3">
            {stats?.talukas?.map((taluka: any, idx: number) => (
              <div key={idx} className="p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {taluka.name || 'Unknown'} Taluka
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Dengue — Dharwad District</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    taluka.cases >= 50 ? 'bg-red-500/20 text-red-600' :
                    taluka.cases >= 20 ? 'bg-orange-500/20 text-orange-600' :
                    'bg-yellow-500/20 text-yellow-600'
                  }`}>
                    {taluka.cases} cases
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 mt-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min((taluka.cases / stats.total_cases) * 100 * 5, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Gender Distribution (Real Data)</h2>
        <div className="flex rounded-full overflow-hidden h-10 mb-3">
          <div className="bg-blue-500 flex items-center justify-center text-white font-medium"
            style={{ width: `${(stats?.male_count / stats?.total_cases) * 100}%` }}>
            Male {stats?.male_count}
          </div>
          <div className="bg-pink-500 flex items-center justify-center text-white font-medium"
            style={{ width: `${(stats?.female_count / stats?.total_cases) * 100}%` }}>
            Female {stats?.female_count}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-500 font-medium">Male: {Math.round((stats?.male_count / stats?.total_cases) * 100)}%</span>
          <span className="text-pink-500 font-medium">Female: {Math.round((stats?.female_count / stats?.total_cases) * 100)}%</span>
        </div>
      </div>

      {/* Health Alerts - Generated from Real Data */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Health Alerts</h2>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 border border-border rounded-lg flex items-start gap-3 hover:bg-muted/50 transition-colors">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                alert.risk_level === 'critical' ? 'text-red-600' :
                alert.risk_level === 'high' ? 'text-orange-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <p className="text-foreground font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                alert.risk_level === 'critical' ? 'bg-red-500/20 text-red-600' :
                alert.risk_level === 'high' ? 'bg-orange-500/20 text-orange-600' :
                'bg-yellow-500/20 text-yellow-600'
              }`}>{alert.risk_level}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-slide-in-from-bottom { animation: slide-in-from-bottom 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
