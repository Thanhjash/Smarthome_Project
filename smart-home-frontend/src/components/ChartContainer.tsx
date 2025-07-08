"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => (
  <Card className="bg-gray-800/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
    <CardHeader>
      <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
