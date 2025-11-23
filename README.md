
# Dahb IA - Oracle ERP Intelligent Documentation Platform

## 1. Overview
Dahb IA is a modern React application designed to centralize, analyze, and visualize technical documentation for Oracle ERP Cloud implementations. It solves the problem of dispersed documents (SFD, STD, SETUP, etc.) by indexing them into a searchable knowledge base.

## 2. Key Features

### 🔍 Advanced Search
- **Full-Text Search**: Find components by ID or Name.
- **Deep Search**: Locate specific Oracle tables (e.g., `AP_INVOICES`), CUF Parameters, or OICS integrations extracted from within the documents.

### 📊 Dependency Visualization
- Interactive D3.js graph showing relationships between components (ControlM jobs).
- Visualizes prerequisites and data flow between modules (e.g., AP -> GL).

### 🤖 Intelligent Robot Scanner
- **Smart Cataloging**: Automatically identifies Component ID and Document Type, even without strict naming conventions.
- **AI Inference**: Analyzes filenames and simulates content analysis to categorize files (e.g., detecting "param" keywords for SETUP documents).
- **Metadata Extraction**: Simulates extracting CUF params and Tables from unstructured content.

### 🧠 AI Assistant
- Integrated **Gemini 2.5 Flash** chat interface.
- Context-aware answers based on the indexed component data (RAG simulation).

## 3. How to Use the Scanner

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

## 4. Technical Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Visualization**: D3.js (Graph), Recharts (Charts)
*   **AI**: Google Gemini 2.5 Flash (via @google/genai)
