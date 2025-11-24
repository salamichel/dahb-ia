
# Dahb IA - Multi-Domain Intelligent Documentation Platform

## 1. Overview
Dahb IA is a modern platform combining a React visualization interface and an intelligent document indexing robot. Originally designed for Oracle ERP Cloud, it now supports multiple business domains (Delphes, RBM-NRM, BI Publisher, ETL, IBM Cotre, Tradeshift, C2FO, Abacus). It solves the problem of dispersed technical documents (SFD, STD, SETUP, etc.) by automatically indexing them into a searchable knowledge base using AI.

## 2. Key Features

### 🔍 Advanced Search
- **Full-Text Search**: Find components by ID or Name.
- **Deep Search**: Locate specific Oracle tables (e.g., `AP_INVOICES`), CUF Parameters, or OICS integrations extracted from within the documents.

### 📊 Dependency Visualization
- Interactive D3.js graph showing relationships between components (ControlM jobs).
- Visualizes prerequisites and data flow between modules (e.g., AP -> GL).

### 🤖 Robot V2 - Automatic Document Indexing
- **Real-time Monitoring**: Watches configured folders and automatically processes new/modified documents
- **Multi-format Support**: DOCX, PDF, and TXT files
- **AI-Powered Analysis**: Uses Gemini 1.5 Flash to extract metadata, parameters, integrations, and technical elements
- **Multi-domain Detection**: Automatically identifies the business domain and adapts extraction accordingly
- **Idempotent Processing**: Uses SHA-256 hashing to avoid reprocessing unchanged files
- **Smart Integration**: Seamlessly merges data with the web interface in real-time

### 🧠 AI Assistant
- Integrated **Gemini 2.5 Flash** chat interface.
- Context-aware answers based on the indexed component data (RAG simulation).

## 3. Quick Start

### Frontend Interface
```bash
npm install
npm run dev
```
Open http://localhost:5173

### Robot V2 (Automatic Indexing)

**Full documentation**: See `robot/README.md` and `robot/QUICKSTART.md`

```bash
cd robot
npm install

# Initialize database
npm run init

# Configure API key in .env
# GOOGLE_API_KEY=your_key_here

# Start the robot
npm start
```

The robot will:
1. Watch the configured folders (default: `./documents/`)
2. Automatically process DOCX, PDF, and TXT files
3. Extract metadata with Gemini AI
4. Save to `metadata.json` (consumed by the web interface)
5. Update in real-time as files change

### Supported Domains
- **Oracle ERP Cloud**: GL, AP, AR, PO, OM, HCM, FA
- **Delphes-OeBS**: Legacy E-Business Suite
- **RBM-NRM**: Natural Resource Management
- **BI Publisher**: Reports and data models
- **ETL SI Finance**: ODI/OIC integrations
- **IBM Cotre**: Cognos solutions
- **Tradeshift**: Supplier network
- **C2FO**: Working capital optimization
- **Abacus**: Abajus system

## 4. How to Use the Scanner

The **Robot Scanner** is now enhanced with AI simulation capabilities to handle unstructured inputs.

1.  Navigate to the **Robot Scanner** tab via the sidebar.
2.  Drag and drop **ANY** file (PDF, DOCX, TXT) into the drop zone.
3.  **Automatic Categorization**:
    *   **Standard Files**: If the file is named `AP020_SETUP.docx`, it is instantly cataloged.
    *   **Unstructured Files**: If the file is named `specification_fonctionnelle_compta_GL018.pdf`:
        *   The robot detects `GL018` as the Component ID.
        *   The robot detects "fonctionnelle" and classifies it as `SFD`.
    *   **Unknown Files**: If the file is `new_process.docx` (no ID):
        *   The robot generates a new tracking ID (e.g., `NEW123`).
        *   Defaults type to `SFD` or guesses based on other keywords.
4.  **Simulation Results**:
    *   Files classified as `SETUP` will trigger simulated extraction of **CUF Parameters**.
    *   Files classified as `STD` will trigger simulated extraction of **Oracle Tables**.

## 5. Technical Stack

### Frontend
*   **Framework**: React 19, TypeScript
*   **Styling**: Tailwind CSS (inline)
*   **Visualization**: D3.js (Graph), Recharts (Charts)
*   **Icons**: Lucide React
*   **Build**: Vite

### Robot V2
*   **Runtime**: Node.js (ES Modules)
*   **AI**: Google Gemini 1.5 Flash (via @google/generative-ai)
*   **File Watching**: Chokidar
*   **Document Parsing**: Mammoth (DOCX), pdf-parse (PDF)
*   **Data Storage**: JSON (compatible with frontend)
