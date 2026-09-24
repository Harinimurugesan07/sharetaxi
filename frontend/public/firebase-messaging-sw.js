importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyB6meltiRUMGFbjDmC-5NWUTl84J1_WO7A',
  authDomain: 'share-taxi-b498f.firebaseapp.com',
  projectId: 'share-taxi-b498f',
  storageBucket: 'share-taxi-b498f.firebasestorage.app',
  messagingSenderId: '169526746572',
  appId: '1:169526746572:web:96081673edbd53c9d6d169',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload?.notification || {};

  self.registration.showNotification(title || 'ShareTaxi', {
    body: body || 'You have a new notification.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'sharetaxi-notification',
    renotify: true,
  });
});
