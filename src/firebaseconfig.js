// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBF-_YQTT5pq03sK8Qy3EUw-BG9ERXpb2o",
  authDomain: "mayi-demo.firebaseapp.com",
  projectId: "mayi-demo",
  storageBucket: "mayi-demo.appspot.com",
  messagingSenderId: "847683217037",
  appId: "1:847683217037:web:bb761bbaeaf918ded924c4",
  measurementId: "G-0PR14JZ93W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);