# Éleveur+ — Application de suivi GPS de troupeau

Système complet composé de **trois briques technologiques distinctes**,
chacune écrite dans le langage adapté à son rôle :

| Brique | Langage / Techno | Pourquoi ce langage |
|---|---|---|
| Application mobile | **JavaScript (React Native + Expo)** | Multiplateforme (Android/iOS), riche écosystème pour cartes, notifications, formulaires |
| Base de données / backend | **Firebase (Firestore, Auth, Storage)** | Temps réel, sans serveur à gérer, règles de sécurité déclaratives |
| Collier connecté | **C++ (Arduino Framework) sur ESP32** | Un microcontrôleur ne peut pas exécuter du JavaScript ; le C++ est le langage natif de la programmation embarquée, indispensable pour piloter le GPS, la vibration et le modem 4G |

Ce n'est pas une contrainte de choix : **JavaScript ne tourne pas sur un ESP32**.
Le collier a besoin d'un firmware compilé et optimisé pour microcontrôleur, d'où le C++.

## Structure du projet

```
elevage-app/
├── App.js                        # Point d'entrée
├── app.json                      # Config Expo
├── package.json
├── firebase/
│   ├── firebaseConfig.js         # Connexion à Firebase
│   └── firestore.rules           # Règles de sécurité (à déployer sur Firebase)
├── src/
│   ├── context/AuthContext.js    # Gestion de la session utilisateur
│   ├── navigation/AppNavigator.js
│   ├── screens/                  # Un fichier par écran (voir liste ci-dessous)
│   ├── components/                # AnimalCard, StatCard (réutilisables)
│   ├── services/                  # Fonctions Firestore (CRUD) par domaine
│   └── theme/colors.js           # Palette de couleurs centralisée
└── collar-firmware/
    └── collar_esp32.ino          # Firmware C++ du collier (ESP32 + SIM7600 + GPS NEO6M)
```

## Écrans réalisés

- `LoginScreen` / `SignupScreen` — authentification Firebase
- `DashboardScreen` — statistiques en temps réel (animaux, zones, alertes, batterie)
- `AnimalsScreen` / `AddAnimalScreen` / `AnimalDetailScreen` — gestion des animaux
- `MapScreen` — carte Google Maps, dessin de zones virtuelles au doigt, affichage des animaux
- `AlertsScreen` — flux d'alertes en temps réel
- `HistoryScreen` — trajet, distance parcourue, temps de déplacement/arrêt
- `ProfileScreen` / `CollarSettingsScreen` — profil utilisateur et réglages du collier

## Installation et lancement (application mobile)

```bash
cd elevage-app
npm install
npx expo start
```

Prérequis :
- Node.js installé
- Application **Expo Go** sur ton téléphone (ou un émulateur Android/iOS)
- Un projet Firebase créé, avec Authentication (Email/Password) et Firestore activés
- Remplacer les valeurs dans `firebase/firebaseConfig.js` par celles de ta console Firebase

## Déploiement des règles de sécurité Firestore

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Collections Firestore attendues

`users`, `animals`, `zones`, `collars`, `locations`, `alerts`, `history`, `settings`
(chaque document métier porte un champ `ownerId` correspondant à l'UID de l'éleveur).

## Firmware du collier (`collar-firmware/collar_esp32.ino`)

À ouvrir avec **Arduino IDE** ou **PlatformIO**.

Bibliothèques nécessaires (à installer via le gestionnaire de bibliothèques Arduino) :
- `TinyGPSPlus` — lecture du module GPS NEO6M
- `ArduinoJson` — construction/lecture des requêtes JSON vers Firestore

Logique implémentée :
1. Lecture GPS en continu
2. Test point-dans-polygone (algorithme du ray casting) pour savoir si l'animal est dans la zone
3. Calcul de la distance à la bordure la plus proche → vibration progressive si l'animal s'approche (zone tampon configurable, `BUFFER_SORTIE_M`)
4. Vibration renforcée + alerte immédiate en cas de sortie confirmée
5. Envoi périodique de la position et de la batterie vers Firestore (API REST, via commandes AT du SIM7600)
6. Synchronisation périodique des zones et paramètres définis dans l'application

## Ce qu'il reste à faire pour une mise en production

- Remplacer les appels REST simplifiés du firmware par une bibliothèque HTTPS robuste (ex. `TinyGSMClient`)
- Ajouter des **Cloud Functions** Firebase pour sécuriser l'écriture des positions/alertes venant du collier (actuellement une clé API dédiée au collier est recommandée plutôt qu'un compte utilisateur classique)
- Ajouter l'upload de photo vers Firebase Storage dans `AddAnimalScreen`
- Générer l'APK de production avec `eas build`
