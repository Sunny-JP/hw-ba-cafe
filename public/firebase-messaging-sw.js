importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBaqZE7mhxaXPWwQAG3DKZkDwLr6LO_WII",
  authDomain: "ba-cafe-timer.firebaseapp.com",
  projectId: "ba-cafe-timer",
  storageBucket: "ba-cafe-timer.firebasestorage.app",
  messagingSenderId: "1064781402252",
  appId: "1:1064781402252:web:b6598559c5a8060742aba9",
  measurementId: "G-DMZKH2K8R4",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
