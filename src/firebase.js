import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC97bhjJQ0l4HFi_6zo4O1lBxC9yB_OSIo",
  authDomain: "nutriselectbd.firebaseapp.com",
  projectId: "nutriselectbd",
  storageBucket: "nutriselectbd.appspot.com",
  messagingSenderId: "714516659695",
  appId: "1:714516659695:web:8ab3f7dc6242bdee7f0a1a"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, createUserWithEmailAndPassword };
