'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Activity, MapPin, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect to appropriate dashboard
      switch (user.role) {
        case 'doctor':
          router.push('/dashboard/doctor');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'society':
          router.push('/dashboard/society');
          break;
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
              M
            </div>
            <span>Medical GIS</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-primary font-medium hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium hover:opacity-90 transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Advanced Disease Risk
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Prediction Platform
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Leverage geospatial intelligence and machine learning to predict and prevent disease outbreaks in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              Start Now
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg border border-border text-foreground font-semibold hover:bg-muted transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: MapPin,
              title: 'Geospatial Analysis',
              description: 'Real-time mapping of disease hotspots across districts and taluks',
            },
            {
              icon: TrendingUp,
              title: 'Predictive Models',
              description: 'AI-powered risk scores based on historical data and trends',
            },
            {
              icon: Activity,
              title: 'Live Monitoring',
              description: 'Track disease cases and alerts as they happen',
            },
            {
              icon: Shield,
              title: 'Risk Assessment',
              description: 'Comprehensive analysis for informed healthcare decisions',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all duration-300 hover:shadow-lg group animate-slide-in-from-bottom"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <feature.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* User Roles Section */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Designed for Everyone
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'Doctors',
                description: 'Report cases and access real-time risk predictions for your region',
                features: ['Report disease cases', 'View local risks', 'Track alerts', 'Case history'],
                icon: Activity,
              },
              {
                role: 'Administrators',
                description: 'Manage users, oversee system health, and retrain ML models',
                features: ['User management', 'System analytics', 'Model retraining', 'Report generation'],
                icon: Shield,
              },
              {
                role: 'Public Health',
                description: 'Monitor public health trends and coordinate prevention strategies',
                features: ['Public statistics', 'Risk tracking', 'Health alerts', 'Public education'],
                icon: TrendingUp,
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center bg-gradient-to-br from-background to-muted border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="flex justify-center mb-3">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.role}
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  {item.description}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  {item.features.map((feature, i) => (
                    <li key={i} className="flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 px-4 py-2 rounded-lg text-primary font-medium border border-primary/30 hover:bg-primary/5 transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>
            Medical GIS Disease Prediction System © 2024. Advanced geospatial healthcare intelligence.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-in-from-bottom {
          animation: slide-in-from-bottom 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
