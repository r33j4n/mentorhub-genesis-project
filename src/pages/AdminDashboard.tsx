
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { TabsContent } from '@/components/ui/tabs';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminMentorsTable } from '@/components/admin/AdminMentorsTable';
import { AdminMenteesTable } from '@/components/admin/AdminMenteesTable';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminTabsNavigation } from '@/components/admin/AdminTabsNavigation';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAdminStats } from '@/hooks/useAdminStats';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useAdminAccess(user);
  const { stats, loadStats } = useAdminStats(user);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminHeader onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminStatsCards stats={stats} />

        <AdminTabsNavigation defaultValue="users">
          <TabsContent value="users" className="space-y-6">
            <AdminUsersTable onStatsChange={loadStats} />
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <AdminMentorsTable onStatsChange={loadStats} />
          </TabsContent>

          <TabsContent value="mentees" className="space-y-6">
            <AdminMenteesTable onStatsChange={loadStats} />
          </TabsContent>
        </AdminTabsNavigation>
      </div>
    </div>
  );
}
