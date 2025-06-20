
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserX } from 'lucide-react';

interface AdminTabsNavigationProps {
  defaultValue: string;
  children: React.ReactNode;
}

export const AdminTabsNavigation = ({ defaultValue, children }: AdminTabsNavigationProps) => {
  return (
    <Tabs defaultValue={defaultValue} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
        <TabsTrigger value="users" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white rounded-lg transition-all">
          <Users className="h-4 w-4 mr-2" />
          Users
        </TabsTrigger>
        <TabsTrigger value="mentors" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white rounded-lg transition-all">
          <UserCheck className="h-4 w-4 mr-2" />
          Mentors
        </TabsTrigger>
        <TabsTrigger value="mentees" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white rounded-lg transition-all">
          <UserX className="h-4 w-4 mr-2" />
          Mentees
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};
