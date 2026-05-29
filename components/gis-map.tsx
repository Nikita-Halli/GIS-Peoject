'use client';

import { useEffect, useRef, useState } from 'react';

interface Patient {
  patient_name: string;
  latitude: number;
  longitude: number;
  disease_name?: string;
  district?: string;
}

export function GISMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<any>(null);

  // ✅ FETCH FROM BACKEND (REAL DATASET)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/patients/map-data")
      .then(res => res.json())
      .then(data => {
  console.log("MAP DATA:", data);

  const cases = data.cases || [];

  const mapped = cases.map((p: any) => ({
    patient_name: p.name,
    latitude: p.lat,
    longitude: p.lng,
    district: p.district,
    disease_name: p.disease
  }));

  setPatients(mapped);
})
      .catch(err => console.error("Map fetch error:", err));
  }, []);

  // 🎯 DRAW MAP
  useEffect(() => {
    if (!containerRef.current || patients.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.innerHTML = '';
    container.appendChild(canvas);

    // background
    ctx.fillStyle = '#f5f7fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerLat = 15.4;
    const centerLng = 75.1;
    const scale = 200;

    const getXY = (lat: number, lng: number) => ({
      x: (lng - centerLng) * scale + canvas.width / 2,
      y: canvas.height / 2 - (lat - centerLat) * scale,
    });

    // ⭐ USE REAL DATA (NO HARDCODE)
    patients.forEach((p) => {
      if (!p.latitude || !p.longitude) return;

      const { x, y } = getXY(p.latitude, p.longitude);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.font = '11px Arial';
      ctx.fillText(p.patient_name?.slice(0, 10), x + 8, y);
    });

    // click detection
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      patients.forEach((p) => {
        const { x, y } = getXY(p.latitude, p.longitude);
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);

        if (dist < 10) {
          setSelected(p);
        }
      });
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);

  }, [patients]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="w-full h-[600px] border rounded-xl bg-white"
      />

      {selected && (
        <div className="p-4 border rounded bg-white">
          <h3 className="font-bold">{selected.patient_name}</h3>
          <p>Disease: {selected.disease_name || "Dengue"}</p>
          <p>District: {selected.district}</p>
          <p>Lat: {selected.latitude}</p>
          <p>Lng: {selected.longitude}</p>
        </div>
      )}
    </div>
  );
}