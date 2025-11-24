# 🔧 Configuration des Patterns de Noms de Fichiers

Le robot v2 utilise un système de **patterns configurables** via le fichier `naming-patterns.json`. Cela permet de supporter n'importe quelle convention de nommage sans modifier le code.

## 📄 Fichier de configuration : `naming-patterns.json`

### Structure globale

```json
{
  "patterns": [ /* Liste des patterns */ ],
  "relationships": { /* Règles de liaison entre fichiers */ },
  "docTypeKeywords": { /* Mots-clés pour détection auto */ },
  "globalSettings": { /* Options globales */ }
}
```

## 🎯 Ajouter un nouveau pattern

### Exemple : Votre nouvelle convention

Supposons que vous ayez une nouvelle convention :
```
PROJET.MODULE.VERSION_TYPE_ID_Description.docx
```

Exemple : `COMPTA.FIN.2024_SET_1234_Interface_Paiements.docx`

### 1. Définir la regex

```json
{
  "name": "Format COMPTA",
  "enabled": true,
  "regex": "^(?:COMPTA\\.)?(?:FIN\\.)?(?:\\d{4}_)?([A-Z]+)_(\\d{3,4})_(.+)$",
  "groups": {
    "docType": 1,
    "componentId": 2,
    "componentName": 3
  },
  "typeMapping": {
    "SET": "SETUP",
    "SFD": "SFD",
    "STD": "STD"
  },
  "examples": [
    "COMPTA.FIN.2024_SET_1234_Interface_Paiements.docx"
  ]
}
```

### 2. Explication des champs

- **`name`** : Nom descriptif du pattern (affiché dans les logs)
- **`enabled`** : `true` ou `false` pour activer/désactiver
- **`regex`** : Expression régulière pour matcher le nom de fichier
- **`groups`** : Indique quel groupe de capture correspond à quoi
  - **`componentId`** : Numéro du groupe capturant l'ID du composant
  - **`componentName`** : Numéro du groupe capturant le nom
  - **`docType`** : Numéro du groupe capturant le type de document
- **`typeMapping`** : Conversion des abréviations vers types standards
- **`examples`** : Exemples de fichiers correspondant au pattern (pour documentation)
- **`priority`** (optionnel) : Ordre de traitement (par défaut 0, les négatifs sont traités en dernier)

### 3. Comprendre les groupes de capture

Dans la regex `^(?:COMPTA\\.)?(?:FIN\\.)?(?:\\d{4}_)?([A-Z]+)_(\\d{3,4})_(.+)$` :

- `(?:COMPTA\\.)?` : Groupe non-capturant (ne compte pas dans les numéros)
- `([A-Z]+)` : **Groupe 1** - Capture le type (SET, SFD, etc.)
- `(\\d{3,4})` : **Groupe 2** - Capture l'ID (1234)
- `(.+)` : **Groupe 3** - Capture le nom (Interface_Paiements)

Donc :
```json
"groups": {
  "docType": 1,       // Groupe 1 = SET
  "componentId": 2,   // Groupe 2 = 1234
  "componentName": 3  // Groupe 3 = Interface_Paiements
}
```

## 🔗 Configurer des relations entre fichiers

### Cas d'usage : MOP lié à un composant

Vous avez `MOP_Installation_OIC_FDJ_AP015.docx` qui est un document d'installation pour le composant `AP015`.

```json
{
  "relationships": {
    "rules": [
      {
        "name": "MOP liés aux composants",
        "pattern": "MOP_.+_(AP\\d{3,4}|GL\\d{3,4}|AR\\d{3,4})",
        "action": "link_to_component",
        "extractMainId": 1,
        "comment": "Les fichiers MOP sont liés au composant Oracle mentionné"
      }
    ]
  }
}
```

Résultat : Le fichier sera indexé et lié au composant `AP015`.

### Autre exemple : Documents avec référence explicite

Fichiers comme `Annexe_Technique_REF_0549.pdf` qui référencent le composant `0549` :

```json
{
  "name": "Documents annexes avec référence",
  "pattern": "_REF_(\\d{4})",
  "action": "link_to_component",
  "extractMainId": 1,
  "comment": "Fichiers contenant _REF_0549 sont liés au composant 0549"
}
```

## 🔤 Configurer la détection de types par mots-clés

Si le type de document n'est pas trouvé par pattern, le robot cherche des mots-clés :

```json
{
  "docTypeKeywords": {
    "SETUP": ["setup", "config", "paramétrage", "set"],
    "SFD": ["sfd", "fonctionnelle", "functional"],
    "STD": ["std", "technique", "technical"],
    "MOP": ["mop", "installation", "deploy"],
    "FN": ["fn", "fiche", "note"]
  }
}
```

Vous pouvez ajouter vos propres mots-clés :

```json
"SETUP": ["setup", "config", "paramétrage", "configuration initiale"],
"CUSTOM_TYPE": ["rapport", "analyse", "étude"]
```

## ⚙️ Options globales

```json
{
  "globalSettings": {
    "caseInsensitive": true,        // Ignorer la casse (recommandé)
    "cleanUnderscores": true,       // Convertir _ en espaces dans les noms
    "cleanDashes": false,           // Convertir - en espaces
    "fallbackToNumericId": true,    // Chercher un ID numérique si aucun pattern
    "generateIdIfNotFound": true    // Générer un ID si rien trouvé
  }
}
```

## 🧪 Tester vos patterns

### 1. Ajouter votre fichier de test

Éditez `test-patterns.js` et ajoutez vos exemples :

```javascript
const testFiles = [
  'COMPTA.FIN.2024_SET_1234_Interface_Paiements.docx',
  'MON_FORMAT_SPECIFIQUE_XYZ_0789.pdf',
  // ... autres fichiers
];
```

### 2. Lancer le test

```bash
npm run test-patterns
```

Ou directement :
```bash
node test-patterns.js
```

Vous verrez immédiatement si votre pattern fonctionne :

```
✅ Pattern "Format COMPTA" matched
📄 COMPTA.FIN.2024_SET_1234_Interface_Paiements.docx
   ├─ Pattern: Format COMPTA
   ├─ ID: 1234
   ├─ Type: SETUP
   └─ Nom: Interface Paiements
```

## 📚 Exemples complets

### Format projet avec version

**Convention** : `PROJ_V2_SET_0549_Description.docx`

```json
{
  "name": "Format projet avec version",
  "enabled": true,
  "regex": "^PROJ_V\\d+_([A-Z]+)_(\\d{4})_(.+)$",
  "groups": {
    "docType": 1,
    "componentId": 2,
    "componentName": 3
  },
  "typeMapping": {
    "SET": "SETUP",
    "SFD": "SFD"
  }
}
```

### Format date + ID

**Convention** : `20250115_SFD_0549_Description.docx`

```json
{
  "name": "Format avec date",
  "enabled": true,
  "regex": "^\\d{8}_([A-Z]+)_(\\d{4})_(.+)$",
  "groups": {
    "docType": 1,
    "componentId": 2,
    "componentName": 3
  }
}
```

### Format simple avec préfixe

**Convention** : `DOC-0549-SETUP.docx`

```json
{
  "name": "Format préfixe DOC",
  "enabled": true,
  "regex": "^DOC-(\\d{4})-([A-Z]+)$",
  "groups": {
    "componentId": 1,
    "docType": 2
  },
  "typeMapping": {
    "SETUP": "SETUP",
    "FUNC": "SFD",
    "TECH": "STD"
  }
}
```

## 🛠️ Commandes utiles

### Lister tous les patterns configurés

```bash
node -e "import('./pattern-matcher.js').then(m => m.listPatterns().then(console.log))"
```

### Tester un fichier spécifique

```javascript
import { parseFilenameWithPatterns } from './pattern-matcher.js';

const result = await parseFilenameWithPatterns('MON_FICHIER.docx');
console.log(result);
```

### Ajouter un pattern par code

```javascript
import { addPattern } from './pattern-matcher.js';

await addPattern({
  name: "Mon nouveau pattern",
  regex: "^CUSTOM_(\\d{4})_(.+)$",
  groups: {
    componentId: 1,
    componentName: 2
  }
});
```

## 🚨 Erreurs courantes

### Pattern ne matche pas

**Problème** : Votre fichier n'est pas détecté

**Solutions** :
1. Vérifiez la regex dans un testeur comme [regex101.com](https://regex101.com)
2. Assurez-vous que `caseInsensitive` est à `true` si votre nom contient minuscules
3. Testez avec `test-patterns.js`
4. Activez les logs : Le robot affiche quel pattern a matché

### Mauvais groupes

**Problème** : Le type ou l'ID ne sont pas extraits correctement

**Solution** : Comptez les groupes de capture `( )` dans votre regex :
- Les `(?:...)` ne comptent PAS
- Seuls les `(...)` comptent
- La numérotation commence à 1 (pas 0)

### Priorité des patterns

**Problème** : Le mauvais pattern est appliqué

**Solution** : Utilisez le champ `priority` :
- Les patterns avec `priority` plus élevée sont testés en premier
- Par défaut : `priority: 0`
- Patterns fallback : `priority: -1`

Exemple :
```json
{
  "name": "Pattern spécifique",
  "priority": 10,  // Testé en premier
  "regex": "^EXACT_FORMAT_(.+)$"
},
{
  "name": "Pattern générique",
  "priority": 0,  // Testé après
  "regex": "^(.+)$"
}
```

## 💡 Bonnes pratiques

1. **Testez toujours vos patterns** avec `test-patterns.js` avant de les déployer
2. **Documentez vos patterns** avec des exemples clairs
3. **Utilisez des noms descriptifs** pour faciliter le debug
4. **Commencez spécifique** : Mettez les patterns les plus spécifiques en premier
5. **Gardez un fallback** : Le pattern "Numeric ID fallback" capture tout ID de 3-4 chiffres
6. **Versionnez vos changements** : Committez `naming-patterns.json` avec git

## 📞 Support

Si vous avez des questions sur la configuration des patterns, consultez :
- `NAMING_CONVENTIONS.md` : Vue d'ensemble des formats supportés
- `robot/README.md` : Documentation générale
- `robot/test-patterns.js` : Exemples de tests

## 🎓 Ressources

- [Regex101](https://regex101.com) : Testeur de regex en ligne (choisir "JavaScript" flavor)
- [MDN - Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [Regex Cheat Sheet](https://www.rexegg.com/regex-quickstart.html)
