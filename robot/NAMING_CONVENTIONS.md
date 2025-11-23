# 📝 Conventions de nommage supportées

Le robot v2 supporte plusieurs conventions de nommage pour maximiser la flexibilité.

## 1. Format EVO (PTI - Usine Finance Entreprise)

**Pattern** : `EVO.FINA.XXX_[TYPE]_[ID]_[Description].docx`

### Exemples
```
EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx
EVO.FINA.001_SFD_0549_Interface_Référentiel_Bancaire_CLOUD.docx
EVO.FINA.001_STD_0549_Interface_Référentiel_Bancaire_CLOUD.docx
```

### Extraction automatique
- **ID du composant** : `0549`
- **Type de document** : `SET` → `SETUP`, `SFD`, `STD`
- **Nom du composant** : `Interface Référentiel Bancaire CLOUD` (automatique depuis le nom de fichier)
- **Domaine** : Détecté depuis le contenu (ex: Oracle ERP Cloud, ETL SI Finance, etc.)

### Variantes acceptées
```
EVO.FINA.001_SET_0549_Description.docx    ✅ Standard
FINA.001_SET_0549_Description.docx        ✅ Sans préfixe EVO
001_SET_0549_Description.docx             ✅ Forme courte
SET_0549_Description.docx                 ✅ Forme minimale
```

## 2. Format Standard (Oracle ERP)

**Pattern** : `[MODULE][ID]_[TYPE].docx`

### Exemples
```
AP020_SETUP.docx
GL018_SFD.pdf
PO015_STD.docx
AR025_FN.docx
```

### Extraction automatique
- **ID du composant** : `AP020`, `GL018`, etc.
- **Type de document** : Depuis le nom de fichier
- **Nom du composant** : Extrait du contenu par Gemini
- **Domaine** : Détecté depuis le contenu

## 3. Format avec Description

**Pattern** : `[MODULE][ID]_[TYPE]_[Description].docx`

### Exemples
```
PO015_STD_Commandes_Achat.docx
GL018_SFD_Comptabilisation_Automatique.pdf
```

### Extraction automatique
- **ID** : `PO015`
- **Type** : `STD`
- **Nom** : Extrait du contenu (priorité) ou depuis le nom de fichier
- **Domaine** : Détecté depuis le contenu

## 4. Format Libre

**Pattern** : Tout autre format contenant un ID numérique

### Exemples
```
specification_fonctionnelle_0549.pdf
document_technique_1234.docx
note_setup_0789.txt
```

### Extraction automatique
- **ID** : Premier nombre de 3-4 chiffres trouvé (`0549`, `1234`, `0789`)
- **Type** : Détecté par mots-clés dans le nom/contenu
- **Nom** : Nom du fichier converti
- **Domaine** : Détecté depuis le contenu

## Types de documents reconnus

| Abréviation | Type complet | Mots-clés détectés |
|-------------|--------------|-------------------|
| `SET` | `SETUP` | setup, config, paramétrage, param |
| `SFD` | `SFD` | sfd, spec fonctionnelle, fonctionnelle |
| `STD` | `STD` | std, spec technique, technique |
| `FN` | `FN` | fn, fiche, note |
| `MOP` | `MOP` | mop, installation, déploiement |

## Exemples complets

### Scénario 1 : Documents PTI Finance

Vous déposez ces 3 fichiers dans `robot/documents/` :

```
EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx
EVO.FINA.001_SFD_0549_Interface_Référentiel_Bancaire_CLOUD.docx
EVO.FINA.001_STD_0549_Interface_Référentiel_Bancaire_CLOUD.docx
```

Le robot va :
1. Créer **1 composant** avec l'ID `0549`
2. Nom : `Interface Référentiel Bancaire CLOUD`
3. **3 documents** attachés : SETUP, SFD, STD
4. Analyser le contenu avec Gemini pour extraire :
   - Les tables Oracle (ex: `CE_BANK_ACCOUNTS`, `CE_BANK_BRANCHES`)
   - Les intégrations (ex: `FBDI_BANK_IMPORT`, `REST_BANK_SYNC`)
   - Les paramètres CUF
   - Les règles métier

### Scénario 2 : Mix de formats

```
EVO.FINA.001_SET_0549_Interface_Bancaire.docx    → ID: 0549, Type: SETUP
AP020_SETUP.docx                                   → ID: AP020, Type: SETUP
specification_technique_1234.pdf                   → ID: 1234, Type: STD (auto-détecté)
```

Résultat : **3 composants** distincts indexés automatiquement.

### Scénario 3 : Même composant, plusieurs documents

```
EVO.FINA.001_SET_0549_Interface_Bancaire.docx
EVO.FINA.001_SFD_0549_Interface_Bancaire.docx
specification_technique_0549.pdf
```

Résultat : **1 composant** (ID: `0549`) avec **3 documents** (SETUP, SFD, STD).
Le robot merge intelligemment les métadonnées extraites de chaque document.

## Règles de nommage recommandées

Pour une indexation optimale :

1. **Incluez toujours l'ID** : Facilite le tracking et le regroupement
2. **Incluez le type** : `SET`, `SFD`, `STD` pour éviter l'auto-détection
3. **Description claire** : Utilisez des underscores ou CamelCase
4. **Évitez les espaces** : Préférez `Interface_Bancaire` à `Interface Bancaire`
5. **Cohérence** : Utilisez le même ID pour tous les documents d'un composant

## Logs de parsing

Quand le robot traite un fichier, il affiche :

```
📄 Détection: EVO.FINA.001_SET_0549_Interface_Référentiel_Bancaire_CLOUD.docx
📋 Fichier parsé: ID=0549, Type=SETUP, Pattern=EVO
   Nom extrait: Interface Référentiel Bancaire CLOUD
🎯 Domaine détecté: Oracle ERP Cloud | Type: SETUP | ID: 0549
```

Cela vous permet de vérifier que le parsing est correct avant l'analyse IA.

## Personnalisation

Pour ajouter votre propre convention de nommage, éditez `robot/analyzer.js` :

```javascript
// Ajoutez votre pattern dans la fonction parseFilename()
const customPattern = /^VOTRE_PATTERN_ICI$/i;
const customMatch = baseName.match(customPattern);

if (customMatch) {
  return {
    componentId: customMatch[1],
    componentName: customMatch[2],
    docType: customMatch[3],
    pattern: 'CUSTOM'
  };
}
```

## Test rapide

Pour tester si votre nom de fichier sera correctement parsé :

```bash
cd robot
node test-filename-parsing.js
```

Ajoutez vos exemples dans ce fichier pour vérifier avant de déployer.
