import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../firebase';
import ProjectManager from './ProjectManager';

function Header({ user, currentProject, setCurrentProject, autoSaveStatus }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <header className="header">
      <div className="logo">Scholast</div>
      {user && (
        <div className="center-menu">
          <ProjectManager 
            user={user} 
            currentProject={currentProject} 
            setCurrentProject={setCurrentProject} 
          />
          {autoSaveStatus && <span className="auto-save-status">{autoSaveStatus}</span>}
        </div>
      )}
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
