// // src/App.js
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
// import Header from './components/Header';
// import Sidebar from './components/Sidebar';
// import { FullPageSkeletonLoader } from './components/SkeletonLoader';
// import Dashboard from './components/Dashboard';
// import AuthPage from './components/AuthPage';
// import Prewrite from './components/Prewrite';
// import { auth } from './firebase';
// import './styles/app.css';
 
// function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [currentProject, setCurrentProject] = useState(null);
//   const [autoSaveStatus, setAutoSaveStatus] = useState("");

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       setUser(user);
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   if (isLoading) {
//     return <FullPageSkeletonLoader />;
//   }

//   return (
//     <Router>
//       <div className="App">
//         <Header 
//           user={user} 
//           currentProject={currentProject} 
//           setCurrentProject={setCurrentProject}
//           autoSaveStatus={autoSaveStatus} 
//         />
//         <div className="main-content">
//           {user && <Sidebar />}
//           <main>
//             <Routes>
//               <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
//               <Route path="/" element={user ? <Dashboard currentProject={currentProject} /> : <Navigate to="/auth" />} />
//               <Route path="/prewrite" element={user ? <Prewrite /> : <Navigate to="/auth" />} />
//             </Routes>
//           </main>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;

// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { FullPageSkeletonLoader } from './components/SkeletonLoader';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import Prewrite from './components/prewrite/Prewrite';
import Write from './components/write/Write';
import { auth } from './firebase';
import './styles/app.css';

function App() {

    return (
      <Router>
        <Routes>
          <Route path="/prewrite" element={<Prewrite />} />
          <Route path="/write" element={<Write />} />
        </Routes>
      </Router>
    );
  }


export default App;