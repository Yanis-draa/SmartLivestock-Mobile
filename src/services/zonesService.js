import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";

const zonesRef = collection(db, "zones");

// points = [{ latitude, longitude }, ...]  (au moins 3 points pour un polygone)
export async function createZone({ nom, couleur, description, points }) {
  return addDoc(zonesRef, {
    ownerId: auth.currentUser.uid,
    nom,
    couleur: couleur || "#66BB6A",
    description: description || "",
    points,
    createdAt: serverTimestamp(),
  });
}

export async function updateZone(zoneId, data) {
  return updateDoc(doc(db, "zones", zoneId), data);
}

export async function deleteZone(zoneId) {
  return deleteDoc(doc(db, "zones", zoneId));
}

export function subscribeToZones(callback) {
  const q = query(zonesRef, where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Affectation animal <-> zone (mise à jour du champ zoneId sur le document animal)
export async function assignAnimalToZone(animalId, zoneId) {
  const { doc: docRef, updateDoc: update } = await import("firebase/firestore");
  return update(docRef(db, "animals", animalId), { zoneId });
}
