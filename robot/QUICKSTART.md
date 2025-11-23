# 🚀 Quick Start Guide

## Installation en 3 étapes

### 1. Installer les dépendances

```bash
cd robot
npm install
```

### 2. Configurer la clé API Gemini

Éditez le fichier `.env` et ajoutez votre clé API :

```bash
GOOGLE_API_KEY=votre_clé_api_ici
```

> 💡 Obtenez votre clé gratuite sur : https://makersuite.google.com/app/apikey

### 3. Démarrer le robot

```bash
npm start
```

## Test rapide

1. Le robot surveille maintenant le dossier `./documents/`
2. Déposez un fichier DOCX, PDF ou TXT dans ce dossier
3. Le robot va automatiquement :
   - Parser le document
   - Analyser le contenu avec Gemini
   - Extraire les métadonnées
   - Sauvegarder dans `../metadata.json`

## Exemple de fichier test

Créez un fichier `AP020_SETUP.docx` avec ce contenu :

```
Configuration Oracle AP
=======================

Module: Accounts Payable (AP)
Composant: AP020 - Workflow d'approbation

Paramètres CUF:
- AP_APPROVAL_THRESHOLD = 10000
- AP_AUTO_APPROVE = TRUE

Tables Oracle utilisées:
- AP_INVOICES
- AP_SUPPLIERS
- AP_PAYMENT_SCHEDULES

Intégrations OICS:
- FBDI_AP_INVOICES_IMPORT
- REST_AP_SUPPLIERS_SYNC
```

Le robot détectera automatiquement :
- **ID** : AP020
- **Type** : SETUP
- **Domaine** : Oracle ERP Cloud
- **Module** : AP
- Et extraira tous les paramètres, tables et intégrations !

## Visualiser les résultats

Les données sont sauvegardées dans `../metadata.json` et peuvent être visualisées dans l'interface React :

```bash
cd ..
npm run dev
```

Ouvrez http://localhost:5173 et explorez vos documents indexés !

## Problèmes courants

### "API Key is missing"
→ Vérifiez que `.env` contient bien `GOOGLE_API_KEY=...`

### "File too large"
→ Par défaut, les fichiers > 50 MB sont ignorés. Augmentez `MAX_FILE_SIZE_MB` dans `.env`

### Le robot ne détecte pas mes fichiers
→ Vérifiez que l'extension est bien `.docx`, `.pdf` ou `.txt` (minuscules)

## Support

Consultez le `README.md` pour la documentation complète.
