import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

function Dashboard({ currentProject }) {
  const [user] = useAuthState(auth);
  const [wordsWritten, setWordsWritten] = useState(0);
  const firestore = getFirestore();

  // Fetch words written data from Firestore (example)
  useEffect(() => {
    if (!user || !currentProject) return;

    const fetchWordsWritten = async () => {
      const userDocRef = doc(firestore, 'users', user.uid, 'projects', currentProject);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setWordsWritten(data.wordsWritten || 0);
      }
    };

    fetchWordsWritten();
  }, [user, currentProject, firestore]);

  return (
    <div className="Dashboard">
      <h1>Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-box keep-writing">
          <h2>Keep Writing</h2>
          <p>Continue where you left off!</p>
        </div>

        <div className="dashboard-box mini-lessons">
          <h2>Mini-Lessons</h2>
          <p>Quick tips to improve your writing.</p>
        </div>

        <div className="dashboard-box level-up">
          <h2>Level Up</h2>
          <p>Play games to improve your skills!</p>
        </div>

        <div className="dashboard-box words-written">
          <h2>Words Written</h2>
          <p>{wordsWritten} words written so far.</p>
        </div>
      </div>

      <div className="chart-container">
        <h2>Words Written Over Time</h2>
        {/* Placeholder for chart, use a charting library like Recharts */}
        <p>Chart goes here</p>
      </div>
    </div>
  );
}

export default Dashboard;
