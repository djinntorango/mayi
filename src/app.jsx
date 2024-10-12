// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { FullPageSkeletonLoader } from './components/SkeletonLoader';
import Dashboard from './components/Dashboard';
import Outline from './components/Outline';
import CharacterDatabase from './components/CharacterDatabase';
import DraftEditor from './components/DraftEditor';
import AuthPage from './components/AuthPage';
import StyleSettings from './components/Style';
import Gpt from './components/Gpt';
import { auth } from './firebase';
import './app.css';
 
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <FullPageSkeletonLoader />;
  }

  return (
    <Router>
      <div className="App">
        <Header 
          user={user} 
          currentProject={currentProject} 
          setCurrentProject={setCurrentProject}
          autoSaveStatus={autoSaveStatus} 
        />
        <div className="main-content">
          {user && <Sidebar />}
          <main>
            <Routes>
              <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
              <Route path="/" element={user ? <Dashboard currentProject={currentProject} /> : <Navigate to="/auth" />} />
              <Route path="/outline" element={user ? <Outline currentProject={currentProject} setAutoSaveStatus={setAutoSaveStatus} /> : <Navigate to="/auth" />} />
              <Route path="/characters" element={user ? <CharacterDatabase currentProject={currentProject} /> : <Navigate to="/auth" />} />
              <Route path="/draft" element={user ? <DraftEditor currentProject={currentProject} /> : <Navigate to="/auth" />} />
              <Route path="/style" element={user ? <StyleSettings currentProject={currentProject} /> : <Navigate to="/auth" />} />
              <Route path="/gpt" element={<Gpt currentProject={currentProject} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;