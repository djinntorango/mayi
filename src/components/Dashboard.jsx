import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

function Dashboard({ currentProject }) {
  const [focusTime, setFocusTime] = useState(0);
  const [focusTimeHistory, setFocusTimeHistory] = useState([]);
  const [user] = useAuthState(auth);
  const firestore = getFirestore();

  useEffect(() => {
    if (!user || !currentProject) return;

    let timer;
    let lastUpdateTime = Date.now();
    let accumulatedTime = 0;

    const updateFocusTime = async () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTime) / 1000);
      accumulatedTime += elapsedSeconds;

      if (accumulatedTime >= 5) {
        const projectRef = doc(firestore, 'users', user.uid, 'projects', currentProject.id);
        const today = new Date().toISOString().split('T')[0];

        await setDoc(projectRef, {
          focusSessions: {
            [today]: increment(accumulatedTime)
          }
        }, { merge: true });

        setFocusTime(prevTime => prevTime + accumulatedTime);
        accumulatedTime = 0;
      }

      lastUpdateTime = now;
    };

    const startTimer = () => {
      if (!timer) {
        lastUpdateTime = Date.now();
        timer = setInterval(updateFocusTime, 1000);
      }
    };

    const stopTimer = async () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        await updateFocusTime(); // Save accumulated time
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    const handleFocus = () => {
      startTimer();
    };

    const handleBlur = () => {
      stopTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    startTimer(); // Start the timer when the component mounts

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      stopTimer();
    };
  }, [user, currentProject, firestore]);

  useEffect(() => {
    if (!user || !currentProject) return;

    const fetchFocusTimeHistory = async () => {
      const projectRef = doc(firestore, 'users', user.uid, 'projects', currentProject.id);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const focusSessions = projectDoc.data().focusSessions || {};
        const history = Object.entries(focusSessions).map(([date, seconds]) => ({
          date,
          focusTime: Math.floor(seconds / 60) // Convert seconds to minutes
        }));
        setFocusTimeHistory(history.sort((a, b) => a.date.localeCompare(b.date)).slice(-7));

        // Set current focus time
        const today = new Date().toISOString().split('T')[0];
        setFocusTime(Math.floor((focusSessions[today] || 0) / 60));
      }
    };

    fetchFocusTimeHistory();
  }, [user, currentProject, firestore]);

  return (
    <div className="Dashboard">
      <h1>Dashboard</h1>
      <div className="metrics">
        <div className="focus-hours">
          <h2>Focus Hours</h2>
          <p>Today's Focus Time: {focusTime} minutes</p>
        </div>
        <div className="focus-time-graph">
          <h2>Focus Time Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={focusTimeHistory}>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <Tooltip />
              <Line type="monotone" dataKey="focusTime" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;