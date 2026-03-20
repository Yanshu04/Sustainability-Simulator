const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

let firebaseAuthPromise = null;

export const getFirebaseAuth = async () => {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (!firebaseAuthPromise) {
    firebaseAuthPromise = (async () => {
      const [{ initializeApp }, { getAuth }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);

      const firebaseApp = initializeApp(firebaseConfig);
      return getAuth(firebaseApp);
    })();
  }

  return firebaseAuthPromise;
}

export { hasFirebaseConfig };
