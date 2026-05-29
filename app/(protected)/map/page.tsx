'use client';

import { MapPin, Filter, Download } from 'lucide-react';

export default function MapPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-2">
            <MapPin className="w-8 h-8 text-primary" />
            Disease Risk Map
          </h1>
          <p className="text-muted-foreground">
            Real-time geospatial visualization of disease risk across Karnataka
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-foreground font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* 🌍 GIS MAP (YOUR FOLIUM HTML) */}
      <div className="w-full h-[600px] border rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="/combined_health_map.html"
          className="w-full h-full"
        />
      </div>

      {/* Information Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Total Cases Visualized
          </p>
          <p className="text-2xl font-bold text-foreground">Live Dataset</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Map Type
          </p>
          <p className="text-2xl font-bold text-primary">Folium GIS</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">
            Status
          </p>
          <p className="text-2xl font-bold text-green-600">Active</p>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}