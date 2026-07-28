import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";

const alertsRef = collection(db, "alerts");
const locationsRef = collection(db, "locations");

// Écoute des alertes en temps réel, les plus récentes en premier
export function subscribeToAlerts(callback) {
  const q = query(
    alertsRef,
    where("ownerId", "==", auth.currentUser.uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function markAlertAsRead(alertId) {
  return updateDoc(doc(db, "alerts", alertId), { lu: true });
}

// Écoute de la dernière position connue de chaque collier
// (le collier ESP32 écrit directement dans /locations via l'API Firestore REST ou une Cloud Function)
export function subscribeToLocations(callback) {
  const q = query(locationsRef, where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
