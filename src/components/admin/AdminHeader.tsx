
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  onSignOut: () => void;
}

export const AdminHeader = ({ onSignOut }: AdminHeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <Badge variant="secondary" className="bg-red-100 text-red-800 px-3 py-1">
              <Shield className="h-4 w-4 mr-1" />
              Admin Access
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, Admin</span>
            <Button variant="outline" size="sm" onClick={onSignOut} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
