import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="bg-gray-200 w-64 p-4">
      <ul>
        <li>
          <Link href="/dashboard">
            <a className="block py-2">Dashboard</a>
          </Link>
        </li>
        {/* Add more sidebar links here */}
      </ul>
    </aside>
  );
};

export default Sidebar;
