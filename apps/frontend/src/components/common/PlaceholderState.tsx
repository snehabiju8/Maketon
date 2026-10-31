import React from 'react';
import { LucideIcon, Construction } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PlaceholderStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  moduleName?: string;
}

export const PlaceholderState: React.FC<PlaceholderStateProps> = ({
  title,
  description,
  icon: Icon = Construction,
  moduleName,
}) => {
  return (
    <Card className="border-dashed border-2 border-slate-200 bg-white/70">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
          <Icon className="w-7 h-7" />
        </div>
        {moduleName && (
          <Badge variant="info" className="mb-3">
            {moduleName} Module
          </Badge>
        )}
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">{description}</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Under active development for Brightloop MVP</span>
        </div>
      </CardContent>
    </Card>
  );
};

