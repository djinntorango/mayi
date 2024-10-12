import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../firebase';

function Header({ user, currentProject, setCurrentProject, autoSaveStatus }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <header className="header">
      {user ? (
        <div className="user-info">
          <span className="user-name" onClick={toggleUserMenu}>
            {user.displayName || user.email}
          </span>
          {userMenuOpen && (
            <div className="user-menu">
              <button onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/auth" className="login-button">Login</Link>
      )}
    </header>
  );
}

export default Header;
