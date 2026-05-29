'use client';

import { useState, useEffect } from 'react';
import { Users, Search, MoreVertical } from 'lucide-react';

interface User {
  id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
  organization?: string;
  is_active?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // LOAD USERS FROM LOCAL STORAGE
useEffect(() => {
  try {
    const storedUsers = localStorage.getItem('recent_logins');

if (storedUsers) {
  const parsedUsers = JSON.parse(storedUsers);

  setUsers(parsedUsers);
}
  } catch (error) {
    console.error('Error loading user:', error);
  }
}, []);
  // FILTER USERS
  const filteredUsers = users.filter((user) => {
    const name =
      user.full_name?.toLowerCase() ||
      user.name?.toLowerCase() ||
      '';

    const email =
      user.email?.toLowerCase() || '';

    const role =
      user.role?.toLowerCase() || '';

    const search = searchTerm.toLowerCase();

    return (
      name.includes(search) ||
      email.includes(search) ||
      role.includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-primary" />
          User Management
        </h1>

        <p className="text-muted-foreground">
          Registered doctors, admins, and society users
        </p>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />

        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* TABLE */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Name
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Email
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Role
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Organization
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Status
                </th>

                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {user.full_name || user.name || 'Unknown'}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.email || 'No Email'}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium capitalize">
                        {user.role || 'user'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.organization || 'Medical Department'}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600">
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No registered users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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