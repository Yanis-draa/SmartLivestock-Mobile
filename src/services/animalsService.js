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

const animalsRef = collection(db, "animals");

export async function addAnimal({ nom, espece, race, age, sexe, photoUrl, collierId, notes }) {
  return addDoc(animalsRef, {
    ownerId: auth.currentUser.uid,
    nom,
    espece,
    race: race || "",
    age: age || null,
    sexe,
    photoUrl: photoUrl || null,
    collierId,
    etat: "in", // in | near | out | lost
    notes: notes || "",
    createdAt: serverTimestamp(),
  });
}

export async function updateAnimal(animalId, data) {
  return updateDoc(doc(db, "animals", animalId), data);
}

export async function deleteAnimal(animalId) {
  return deleteDoc(doc(db, "animals", animalId));
}

// Écoute en temps réel de tous les animaux de l'éleveur connecté
export function subscribeToAnimals(callback) {
  const q = query(animalsRef, where("ownerId", "==", auth.currentUser.uid));
  return onSnapshot(q, (snapshot) => {
    const animals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(animals);
  });
}
