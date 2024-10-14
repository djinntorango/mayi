import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <ul>
          <li>
            <Link to="/">
              <span className="sidebar-icon">🏠</span>
              <span className="sidebar-text">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/prewrite">
              <span className="sidebar-icon">✏️</span>
              <span className="sidebar-text">Prewrite</span>
            </Link>
          </li>
          {/* Add more menu items as needed */}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;