#!/bin/bash

# Script de démarrage complet du système Dahb IA
# Lance le robot, l'API patterns et l'interface web en parallèle

echo "╔═══════════════════════════════════════════════════════╗"
echo "║       🤖 Dahb IA - Système de démarrage complet      ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Vérification des dépendances
echo "🔍 Vérification des dépendances..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! [ -f "package.json" ]; then
    echo "❌ Fichier package.json introuvable"
    echo "   Lancez ce script depuis le dossier robot/"
    exit 1
fi

# Installation des dépendances si nécessaire
if ! [ -d "node_modules" ]; then
    echo "📦 Installation des dépendances du robot..."
    npm install
fi

# Création du dossier documents si nécessaire
if ! [ -d "documents" ]; then
    echo "📁 Création du dossier documents/"
    mkdir -p documents
fi

# Vérification de la clé API
if ! grep -q "GOOGLE_API_KEY=." .env 2>/dev/null; then
    echo "⚠️  GOOGLE_API_KEY non configurée dans .env"
    echo "   Certaines fonctionnalités IA ne seront pas disponibles"
fi

echo ""
echo "🚀 Démarrage des services..."
echo ""

# Fonction de nettoyage au CTRL+C
cleanup() {
    echo ""
    echo "🛑 Arrêt de tous les services..."
    kill $(jobs -p) 2>/dev/null
    wait
    echo "👋 Au revoir !"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Démarrage de l'API Pattern Manager
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  API Pattern Manager (port 3001)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node pattern-api.js &
API_PID=$!
sleep 2

# Démarrage de l'API Upload
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  API Upload (port 3002)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node upload-api.js &
UPLOAD_PID=$!
sleep 2

# Démarrage du robot d'indexation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Robot d'indexation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node index.js &
ROBOT_PID=$!
sleep 2

# Démarrage de l'interface web (depuis le dossier parent)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Interface web (port 5173)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ..
npm run dev &
WEB_PID=$!

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                   ✅ Système démarré                  ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║                                                       ║"
echo "║  📊 Interface Web:    http://localhost:5173          ║"
echo "║  🔧 API Patterns:     http://localhost:3001          ║"
echo "║  📤 API Upload:       http://localhost:3002          ║"
echo "║  🤖 Robot:            Actif (surveillant ./documents)║"
echo "║                                                       ║"
echo "║  📁 Upload via interface: Robot Scanner (menu)       ║"
echo "║     ou déposez dans: robot/documents/                ║"
echo "║                                                       ║"
echo "║  ⚙️  Gérer les patterns:                              ║"
echo "║     → Interface: Patterns Config (menu)              ║"
echo "║                                                       ║"
echo "║  🛑 Pour arrêter: CTRL+C                             ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Attendre que tous les processus se terminent
wait
