// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/prewrite">Prewrite</Link></li>
          <li><Link to="/my-writing">My Writing</Link></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;