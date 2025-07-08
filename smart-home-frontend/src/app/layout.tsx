"use client";

import React from 'react';
import Link from 'next/link';
import { Providers } from './providers';
import { ColorModeScript } from '@chakra-ui/react';
import theme from '@/lib/theme';
import '../styles/customStyle.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Smart Home Dashboard</title>
      </head>
      <body>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Providers>{children}</Providers>
      </body>
    </html>
  );
}
