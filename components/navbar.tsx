'use client';

import { useAuth } from '@/app/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut, Home, BarChart3, Users, Settings, Brain } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'doctor':  return '/dashboard/doctor';
      case 'admin':   return '/dashboard/admin';
      case 'society': return '/dashboard/society';
      default:        return '/';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { label: 'Dashboard', href: getDashboardLink(), icon: Home },
    ];

    const roleItems: Record<string, { label: string; href: string; icon: any }[]> = {
      doctor: [
  { label: 'Cases',      href: '/dashboard/doctor/cases',      icon: BarChart3 },
  { label: 'Map',        href: '/map',                         icon: 'map'     },
  { label: 'Prediction', href: '/dashboard/doctor/prediction', icon: Brain     },
],
      admin: [
        { label: 'Users',  href: '/admin/users',  icon: Users    },
        { label: 'Models', href: '/admin/models', icon: Settings },
        { label: 'Map',    href: '/map',          icon: 'map'    },
      ],
     society: [
  { label: 'Map',        href: '/map',                          icon: 'map'  },
  { label: 'Prediction', href: '/dashboard/society/prediction', icon: Brain  },
],
    };

    return [...baseItems, ...(roleItems[user.role] || [])];
  };

  const isActive = (href: string) => pathname === href;

  if (!isAuthenticated || !user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            href={getDashboardLink()}
            className="flex items-center gap-2 font-bold text-lg text-primary hover:text-primary/80 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
              M
            </div>
            <span className="hidden sm:inline">Medical GIS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {getNavigationItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-foreground hover:bg-muted hover:text-primary'
                }`}
              >
                {typeof item.icon === 'string' ? (
                  <span className="text-lg">📍</span>
                ) : (
                  <item.icon className="w-4 h-4" />
                )}
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors duration-200"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden animate-in slide-in-from-top-2 fade-in border-t border-border">
            <div className="py-4 space-y-2">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}