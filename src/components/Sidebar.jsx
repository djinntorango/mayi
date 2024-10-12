// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/outline">Outline</Link></li>
          <li><Link to="/characters">Characters</Link></li>
          <li><Link to="/draft">Draft Editor</Link></li>
          <li><Link to="/style">Style</Link></li>
          <li><Link to="/gpt">老公gpt</Link></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;