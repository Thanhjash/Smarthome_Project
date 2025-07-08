"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Temperature is too high', time: '5 minutes ago' },
    { id: 2, message: 'Humidity is low', time: '1 hour ago' },
  ]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h3 className="font-semibold mb-2">Notifications</h3>
        {notifications.length > 0 ? (
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id} className="mb-2 pb-2 border-b last:border-b-0">
                <p>{notification.message}</p>
                <span className="text-sm text-gray-500">{notification.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No new notifications</p>
        )}
      </PopoverContent>
    </Popover>
  );
};
