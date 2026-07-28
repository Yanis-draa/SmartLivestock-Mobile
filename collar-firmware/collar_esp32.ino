/*
  Firmware collier GPS - ESP32 + SIM7600 (4G) + GPS NEO6M
  Langage : C++ (Arduino Framework) — nécessaire car JavaScript/React Native
  ne s'exécute pas sur microcontrôleur.

  Rôle du collier :
   1. Lire la position GPS (module NEO6M, liaison série)
   2. Comparer cette position aux zones téléchargées depuis Firebase
   3. Décider de faire vibrer le moteur si l'animal approche de la limite
   4. Envoyer position/batterie/alertes à Firebase via le module SIM7600 (réseau 4G)
   5. Télécharger les mises à jour de zones/paramètres à chaque cycle
*/

#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// ---------- Configuration matérielle ----------
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define SIM_RX_PIN 26
#define SIM_TX_PIN 27
#define VIBRATION_PIN 25
#define BATTERY_PIN 34   // entrée analogique pour mesure de tension batterie

HardwareSerial gpsSerial(1);
HardwareSerial simSerial(2);
TinyGPSPlus gps;

// ---------- Identité du collier ----------
const char* COLLAR_ID = "COL-00125";
const char* FIREBASE_PROJECT_ID = "elevage-app";
const char* FIREBASE_API_KEY = "TON_API_KEY";

// ---------- Paramètres synchronisés depuis Firebase (valeurs par défaut) ----------
int intensiteVibration = 60;   // 0-100 %
int dureeVibrationSec = 3;
int frequenceGpsSec = 10;      // fréquence de lecture GPS
int frequenceEnvoiSec = 30;    // fréquence d'envoi à Firebase
const float BUFFER_SORTIE_M = 5.0;  // distance tampon avant la frontière (zone d'alerte)

// ---------- Zone active (polygone téléchargé depuis Firestore) ----------
struct Point { double lat; double lon; };
Point zonePoints[20];
int zonePointsCount = 0;

unsigned long dernierEnvoi = 0;
unsigned long dernierGps = 0;
unsigned long derniereSync = 0;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  simSerial.begin(115200, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
  pinMode(VIBRATION_PIN, OUTPUT);
  pinMode(BATTERY_PIN, INPUT);

  Serial.println("Initialisation du collier " + String(COLLAR_ID));
  initSim7600();
  synchroniserAvecFirebase(); // récupère zone + paramètres au démarrage
}

void loop() {
  // 1. Lecture continue du flux GPS
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  unsigned long maintenant = millis();

  // 2. Cycle de calcul de position (toutes les frequenceGpsSec secondes)
  if (gps.location.isValid() && (maintenant - dernierGps > frequenceGpsSec * 1000UL)) {
    dernierGps = maintenant;
    traiterPosition(gps.location.lat(), gps.location.lng());
  }

  // 3. Cycle d'envoi vers Firebase
  if (maintenant - dernierEnvoi > frequenceEnvoiSec * 1000UL) {
    dernierEnvoi = maintenant;
    envoyerPositionFirebase(gps.location.lat(), gps.location.lng());
    envoyerBatterie();
  }

  // 4. Cycle de synchronisation des zones/paramètres (toutes les 5 minutes)
  if (maintenant - derniereSync > 5UL * 60UL * 1000UL) {
    derniereSync = maintenant;
    synchroniserAvecFirebase();
  }
}

// ---------- Logique de géofencing ----------
void traiterPosition(double lat, double lon) {
  bool dedans = pointDansPolygone(lat, lon, zonePoints, zonePointsCount);
  double distanceLimite = distanceMinimaleAuBord(lat, lon, zonePoints, zonePointsCount);

  if (dedans && distanceLimite < BUFFER_SORTIE_M) {
    // L'animal approche de la limite : vibration progressive (avertissement)
    declencherVibration(intensiteVibration, dureeVibrationSec);
    envoyerAlerte("near", "Animal proche de la limite");
  } else if (!dedans) {
    // Sortie confirmée : vibration plus longue + alerte immédiate
    declencherVibration(100, dureeVibrationSec * 2);
    envoyerAlerte("out", "Sortie confirmée de la zone");
    envoyerPositionFirebase(lat, lon); // envoi immédiat, sans attendre le cycle normal
  }
  // Si dedans et loin de la limite : rien ne se passe (comportement normal)
}

// Test point-dans-polygone (algorithme du ray casting)
bool pointDansPolygone(double lat, double lon, Point* poly, int n) {
  bool inside = false;
  for (int i = 0, j = n - 1; i < n; j = i++) {
    if (((poly[i].lon > lon) != (poly[j].lon > lon)) &&
        (lat < (poly[j].lat - poly[i].lat) * (lon - poly[i].lon) /
               (poly[j].lon - poly[i].lon) + poly[i].lat)) {
      inside = !inside;
    }
  }
  return inside;
}

// Distance approximative (en mètres) au segment de bordure le plus proche
double distanceMinimaleAuBord(double lat, double lon, Point* poly, int n) {
  double minDist = 1e9;
  for (int i = 0; i < n; i++) {
    int j = (i + 1) % n;
    double d = distancePointSegment(lat, lon, poly[i], poly[j]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

double distancePointSegment(double lat, double lon, Point a, Point b) {
  // Approximation simple en mètres via conversion degrés -> mètres (~111km/degré)
  double ax = a.lon * 111320.0, ay = a.lat * 110540.0;
  double bx = b.lon * 111320.0, by = b.lat * 110540.0;
  double px = lon * 111320.0, py = lat * 110540.0;

  double dx = bx - ax, dy = by - ay;
  double len2 = dx * dx + dy * dy;
  double t = len2 == 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = max(0.0, min(1.0, t));
  double projX = ax + t * dx, projY = ay + t * dy;
  return sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// ---------- Vibration ----------
void declencherVibration(int intensite, int dureeSec) {
  int pwmValue = map(intensite, 0, 100, 0, 255);
  analogWrite(VIBRATION_PIN, pwmValue);
  delay(dureeSec * 1000);
  analogWrite(VIBRATION_PIN, 0);
}

// ---------- Communication réseau (SIM7600, commandes AT) ----------
void initSim7600() {
  envoyerCommandeAT("AT");
  envoyerCommandeAT("AT+CPIN?");         // vérifie la présence de la carte SIM
  envoyerCommandeAT("AT+CGATT=1");       // attache au réseau data
  envoyerCommandeAT("AT+CGDCONT=1,\"IP\",\"internet\"");
  envoyerCommandeAT("AT+CGACT=1,1");     // active le contexte PDP (connexion data)
}

void envoyerCommandeAT(const char* cmd) {
  simSerial.println(cmd);
  delay(500);
}

// Envoie la position GPS + horodatage vers Firestore (REST API)
void envoyerPositionFirebase(double lat, double lon) {
  StaticJsonDocument<256> doc;
  doc["fields"]["collierId"]["stringValue"] = COLLAR_ID;
  doc["fields"]["latitude"]["doubleValue"] = lat;
  doc["fields"]["longitude"]["doubleValue"] = lon;
  doc["fields"]["timestamp"]["stringValue"] = "AUTO";

  String payload;
  serializeJson(doc, payload);

  String url = "https://firestore.googleapis.com/v1/projects/" +
               String(FIREBASE_PROJECT_ID) + "/databases/(default)/documents/locations";

  envoyerRequeteHTTPS(url, payload);
}

void envoyerBatterie() {
  int lecture = analogRead(BATTERY_PIN);
  float tension = (lecture / 4095.0) * 3.3 * 2; // pont diviseur de tension
  int pourcentage = constrain(map(tension * 100, 320, 420, 0, 100), 0, 100);

  StaticJsonDocument<128> doc;
  doc["fields"]["collierId"]["stringValue"] = COLLAR_ID;
  doc["fields"]["batterie"]["integerValue"] = pourcentage;

  String payload;
  serializeJson(doc, payload);
  String url = "https://firestore.googleapis.com/v1/projects/" +
               String(FIREBASE_PROJECT_ID) + "/databases/(default)/documents/collars/" + COLLAR_ID;
  envoyerRequeteHTTPS(url, payload);
}

void envoyerAlerte(const char* type, const char* description) {
  StaticJsonDocument<256> doc;
  doc["fields"]["collierId"]["stringValue"] = COLLAR_ID;
  doc["fields"]["type"]["stringValue"] = type;
  doc["fields"]["description"]["stringValue"] = description;

  String payload;
  serializeJson(doc, payload);
  String url = "https://firestore.googleapis.com/v1/projects/" +
               String(FIREBASE_PROJECT_ID) + "/databases/(default)/documents/alerts";
  envoyerRequeteHTTPS(url, payload);
}

// Télécharge la zone active + paramètres depuis Firestore
void synchroniserAvecFirebase() {
  String url = "https://firestore.googleapis.com/v1/projects/" +
               String(FIREBASE_PROJECT_ID) + "/databases/(default)/documents/settings/" + COLLAR_ID;

  String reponse = recevoirRequeteHTTPS(url);

  // Parsing JSON de la réponse pour extraire les paramètres et les points de zone
  StaticJsonDocument<2048> doc;
  DeserializationError err = deserializeJson(doc, reponse);
  if (!err) {
    intensiteVibration = doc["fields"]["intensiteVibration"]["integerValue"] | intensiteVibration;
    dureeVibrationSec = doc["fields"]["dureeVibration"]["integerValue"] | dureeVibrationSec;
    frequenceGpsSec = doc["fields"]["frequenceGps"]["integerValue"] | frequenceGpsSec;

    JsonArray points = doc["fields"]["zonePoints"]["arrayValue"]["values"];
    zonePointsCount = 0;
    for (JsonVariant p : points) {
      if (zonePointsCount >= 20) break;
      zonePoints[zonePointsCount].lat = p["mapValue"]["fields"]["latitude"]["doubleValue"];
      zonePoints[zonePointsCount].lon = p["mapValue"]["fields"]["longitude"]["doubleValue"];
      zonePointsCount++;
    }
  }
}

// Envoi HTTPS générique via commandes AT du SIM7600 (implémentation simplifiée)
void envoyerRequeteHTTPS(String url, String payload) {
  envoyerCommandeAT("AT+HTTPINIT");
  envoyerCommandeAT(("AT+HTTPPARA=\"URL\",\"" + url + "\"").c_str());
  envoyerCommandeAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  simSerial.println("AT+HTTPDATA=" + String(payload.length()) + ",10000");
  delay(200);
  simSerial.println(payload);
  delay(500);
  envoyerCommandeAT("AT+HTTPACTION=1"); // POST
  envoyerCommandeAT("AT+HTTPTERM");
}

String recevoirRequeteHTTPS(String url) {
  envoyerCommandeAT("AT+HTTPINIT");
  envoyerCommandeAT(("AT+HTTPPARA=\"URL\",\"" + url + "\"").c_str());
  envoyerCommandeAT("AT+HTTPACTION=0"); // GET
  delay(1000);

  String reponse = "";
  while (simSerial.available()) {
    reponse += (char)simSerial.read();
  }
  envoyerCommandeAT("AT+HTTPTERM");
  return reponse;
}
