import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ancient-arcanum-0j1d7",
  appId: "1:444453672538:web:73e3ae3af687ed62e6aa63",
  apiKey: "AIzaSyDWSUP2H1R1becyIexDbRafmgfTXZnA1Rw",
  authDomain: "ancient-arcanum-0j1d7.firebaseapp.com",
  storageBucket: "ancient-arcanum-0j1d7.firebasestorage.app",
  messagingSenderId: "444453672538"
};

const DATABASE_ID = "ai-studio-drivefair-d7cba9de-df6a-4adb-b6cb-b188b7e03c94";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the named database ID
export const db = getFirestore(app, DATABASE_ID);

/**
 * Gets a document reference for a simulation ID.
 */
export function getSimulationDocRef(simulationId: string): DocumentReference<DocumentData> {
  return doc(db, 'simulations', simulationId);
}

/**
 * Fetch the simulation state once.
 */
export async function fetchSimulationState(simulationId: string) {
  try {
    const docRef = getSimulationDocRef(simulationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter estado do Firebase:", error);
    return null;
  }
}

/**
 * Helper to upload state to Firestore.
 */
export async function saveSimulationState(simulationId: string, state: any) {
  try {
    const docRef = getSimulationDocRef(simulationId);
    await setDoc(docRef, {
      ...state,
      simulationId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar estado no Firebase:", error);
  }
}


/**
 * Helper to subscribe to real-time simulation updates from Firestore.
 */
export function listenToSimulationState(simulationId: string, callback: (data: any) => void) {
  const docRef = getSimulationDocRef(simulationId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  }, (error) => {
    console.error("Erro ao ouvir alterações no Firebase:", error);
  });
}
