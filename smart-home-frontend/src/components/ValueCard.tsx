import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ValueCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  unit?: string;
  trend: number;
  color: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({ title, value, icon: Icon, unit, trend, color }) => (
  <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-75 z-0`}></div>
    <CardHeader className="relative z-10">
      <CardTitle className="text-lg font-medium text-white flex items-center justify-between">
        {title}
        <Icon className="h-6 w-6 text-white opacity-75" />
      </CardTitle>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold text-white">{value}{unit}</div>
      <p className="text-sm text-white/80 flex items-center mt-2">
        {trend > 0 ? (
          <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-300 mr-1" />
        )}
        <span>{Math.abs(trend)}% from last hour</span>
      </p>
    </CardContent>
  </Card>
);
