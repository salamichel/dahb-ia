# 🎨 Guide d'utilisation de l'interface Pattern Manager

L'interface Pattern Manager vous permet de gérer visuellement les conventions de nommage sans modifier directement `naming-patterns.json`.

## 🚀 Démarrage

### 1. Démarrer l'API

L'interface web communique avec une API Express qui gère `naming-patterns.json`.

```bash
cd robot
npm run api
```

L'API démarre sur **http://localhost:3001**

### 2. Démarrer l'interface web

Dans un autre terminal :

```bash
npm run dev
```

Ouvrez **http://localhost:5173** et cliquez sur **"⚙️ Patterns Config"** dans le menu.

## 📖 Fonctionnalités

### 🧪 Testeur de Patterns

**Zone en haut de la page**

1. Tapez un nom de fichier (exemple : `EVO.FINA.001_SET_0549_Interface_Bancaire.docx`)
2. Cliquez sur **"Tester"**
3. Le système affiche :
   - ✅ **Pattern qui a matché** (ex: "EVO.FINA - Standard PTI Finance")
   - **ID extrait** (ex: 0549)
   - **Type de document** (ex: SETUP)
   - **Nom du composant** (ex: Interface Bancaire)
   - **Liaison** si le fichier est lié à un autre composant

**Exemples à tester** :

```
EVO.FINA.001_SET_0549_Interface_Bancaire.docx
INI.FIN.FDJ.001_SFD_0586_Calcul_Points.docx
MOP_Installation_OIC_AP015.docx
AP020_SETUP.docx
```

### 📋 Liste des Patterns

Chaque pattern est affiché dans une card avec :

**Toggle On/Off** (bouton vert/gris)
- Cliquez pour activer/désactiver un pattern
- Les patterns désactivés apparaissent en gris

**Informations affichées** :
- **Nom** : "EVO.FINA - Standard PTI Finance"
- **Regex** : Expression régulière utilisée
- **Exemples** : Fichiers correspondant au pattern

**Actions disponibles** :

| Icône | Action | Description |
|-------|--------|-------------|
| ⬆️ | Monter | Augmente la priorité (testé en premier) |
| ⬇️ | Descendre | Diminue la priorité |
| ✏️ | Modifier | Édite le pattern |
| 🗑️ | Supprimer | Supprime le pattern (avec confirmation) |

### ➕ Ajouter un Pattern

1. Cliquez sur **"+ Nouveau Pattern"**
2. Remplissez le formulaire :
   - **Nom du Pattern** : "Mon Format Personnalisé"
   - **Regex** : `^MON_FORMAT_(\\d{4})_(.+)$`
3. Cliquez sur **"Sauvegarder"**

**Note** : Pour les regex complexes, consultez `CONFIGURING_PATTERNS.md`

### ✏️ Modifier un Pattern

1. Cliquez sur l'icône **✏️** sur une card
2. Le formulaire d'édition apparaît en haut
3. Modifiez les champs souhaités
4. Cliquez sur **"Sauvegarder"**

### 🔼 Gérer les Priorités

Les patterns sont testés **dans l'ordre d'affichage** (du haut vers le bas).

**Pour réorganiser** :
- Cliquez sur **⬆️** pour monter un pattern
- Cliquez sur **⬇️** pour descendre un pattern

**Conseil** : Mettez les patterns les plus spécifiques en haut, les génériques en bas.

Exemple d'ordre optimal :
```
1. EVO.FINA (très spécifique)
2. INI.FIN.FDJ (très spécifique)
3. Type-first format (MOP, FN) (moyen)
4. Standard Oracle ERP (moyen)
5. Numeric ID fallback (générique)
```

## 🎯 Cas d'usage

### Scénario 1 : Ajouter un nouveau format de projet

Vous avez une nouvelle convention : `PROJET_2025_SET_1234_Description.docx`

1. Cliquez sur **"+ Nouveau Pattern"**
2. Nom : `Format Projet 2025`
3. Regex : `^PROJET_2025_([A-Z]+)_(\\d{4})_(.+)$`
4. Sauvegardez
5. Testez avec : `PROJET_2025_SET_1234_Test.docx`
6. Résultat :
   - ✅ Pattern matched
   - ID: 1234
   - Type: SETUP
   - Nom: Test

### Scénario 2 : Désactiver temporairement un pattern

Vous voulez ignorer le format "Type-first" pendant que vous testez :

1. Trouvez la card **"Type-first format (MOP, FN, etc.)"**
2. Cliquez sur le toggle vert
3. Il devient gris → pattern désactivé
4. Les fichiers `MOP_...` ne seront plus détectés par ce pattern
5. Réactivez-le quand vous voulez

### Scénario 3 : Modifier la priorité

Le pattern "Numeric ID fallback" matche avant vos patterns spécifiques :

1. Trouvez **"Numeric ID fallback"**
2. Cliquez plusieurs fois sur **⬇️** jusqu'en bas
3. Maintenant il sera testé en dernier (comme souhaité)

## 🔧 Mode Développement

### Développement avec hot-reload

**Terminal 1** - API avec auto-restart :
```bash
cd robot
npm run dev:api
```

**Terminal 2** - Interface web :
```bash
npm run dev
```

Les changements dans le code sont appliqués automatiquement.

### Édition manuelle du fichier JSON

Si vous préférez éditer directement :

1. Modifiez `robot/naming-patterns.json`
2. L'API rechargera automatiquement la config
3. Actualisez la page web pour voir les changements

## 📊 Indicateurs visuels

| État | Apparence | Signification |
|------|-----------|---------------|
| ✅ Pattern activé | Card blanche, border grise | Pattern actif et utilisé |
| ❌ Pattern désactivé | Card grise, opacité 60% | Pattern ignoré |
| 🟢 Test réussi | Fond vert | Fichier matché par un pattern |
| 🟡 Test sans match | Fond orange | Aucun pattern ne correspond |

## ⚠️ Erreurs courantes

### "Failed to load patterns"

**Cause** : L'API n'est pas démarrée

**Solution** :
```bash
cd robot
npm run api
```

### "Failed to create pattern"

**Cause** : Regex invalide ou champs manquants

**Solution** :
- Vérifiez que le nom et la regex sont remplis
- Testez votre regex sur [regex101.com](https://regex101.com)

### Le pattern ne matche pas

**Cause** : L'ordre des groupes de capture est incorrect

**Solution** :
- Utilisez le testeur intégré
- Comptez les parenthèses `(...)` dans votre regex
- Consultez `CONFIGURING_PATTERNS.md`

## 💡 Conseils

1. **Testez immédiatement** : Après chaque ajout/modification, utilisez le testeur
2. **Commencez simple** : Ajoutez d'abord des patterns basiques, puis affinez
3. **Documentez vos patterns** : Utilisez le champ "name" de façon descriptive
4. **Ajoutez des exemples** : Facilitera la compréhension future
5. **Backup avant modification** : `naming-patterns.json` est versionné avec git

## 🔌 API Endpoints (pour développeurs)

Si vous voulez créer votre propre client :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/patterns` | Liste tous les patterns |
| POST | `/api/patterns` | Crée un pattern |
| PUT | `/api/patterns/:index` | Met à jour un pattern |
| DELETE | `/api/patterns/:index` | Supprime un pattern |
| POST | `/api/patterns/test` | Teste un nom de fichier |
| PUT | `/api/patterns/:index/priority` | Change la priorité |

Exemple avec curl :
```bash
# Tester un fichier
curl -X POST http://localhost:3001/api/patterns/test \
  -H "Content-Type: application/json" \
  -d '{"filename": "EVO.FINA.001_SET_0549_Test.docx"}'
```

## 📝 Raccourcis clavier (à venir)

- `Ctrl+K` : Focus sur le testeur
- `Ctrl+N` : Nouveau pattern
- `Esc` : Annuler l'édition

## 🎓 Ressources

- **CONFIGURING_PATTERNS.md** : Guide complet de configuration
- **NAMING_CONVENTIONS.md** : Conventions supportées
- **test-patterns.js** : Tests automatisés
- **naming-patterns.json** : Fichier de configuration

## 🐛 Debugging

Activez les logs de l'API :
```bash
cd robot
DEBUG=* npm run api
```

Consultez la console du navigateur (F12) pour voir les requêtes HTTP.
