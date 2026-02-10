# Insurance Claim Verification Platform

A comprehensive web-based platform for managing and verifying insurance claims. This project demonstrates a structured workflow for policy-based claim processing, including document management, automated verification simulation, and result analysis.

## Project Overview

The intuitive interface guides users through the entire claim lifecycle:
1.  **Policy Management**: Define custom insurance policies with specific document requirements.
2.  **Claim Creation**: meaningful data entry for patients and claim types.
3.  **Document Upload**: Dynamic requirements checklist based on the selected policy.
4.  **Automated Verification**: Simulated AI/Rule-engine analysis of the claim against policy terms.

## Technology Stack

### Frontend (`/frontend`)
-   **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
-   **State Management**: React Hooks

### Backend (`/backend`)
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
-   **Database**: [MongoDB](https://www.mongodb.com/)
-   **ODM**: [Motor](https://motor.readthedocs.io/) (Async MongoDB driver)
-   **Validation**: [Pydantic](https://docs.pydantic.dev/)

## Key Features

### 1. Claim Processing Flow
The core of the application is the refined 3-step claim process:
-   **Step 1: Create**: Enter patient and insurer details, select a policy, and choose claim type (Cashless/Reimbursement).
-   **Step 2: Upload**: View "Extracted Details" from the policy. Upload required documents (e.g., Discharge Summary, Bills) as PDFs or images. The system tracks missing documents in real-time.
-   **Step 3: Verify**: Once all documents are uploaded, submit the claim for verification.

### 2. Verification Engine (Simulated)
The backend simulates a sophisticated verification process:
-   **Latency Simulation**: Mimics the time taken for OCR and AI analysis (3-5 seconds).
-   **Scoring Logic**: Generates an "Acceptance Score" and detailed findings (Pass/Fail/Review) for various checks like "Policy Active", "Network Hospital", etc.
-   **Result Visualization**: A dedicated results page displays the score and breakdown of the analysis.

### 3. Policy Management
-   Create custom policies with specific "Required Documents".
-   These requirements dynamically drive the upload checklist for any claim linked to that policy.

## Folder Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # Entry point, CORS, App initialization
│   │   ├── models/          # Pydantic models (Claim, Policy, Document)
│   │   ├── routers/         # API Endpoints (Auth, Claims, Policies)
│   │   └── utils/           # Helper functions (File handling)
│   └── uploads/             # Directory for stored uploaded files
│
├── frontend/
│   ├── app/
│   │   ├── claims/          # Claim workflow pages
│   │   │   ├── new/         # Step 1: Create
│   │   │   ├── [id]/        # Step 2: Upload & Review
│   │   │   └── [id]/result/ # Step 3: Verification Results
│   │   ├── dashboard/       # Main overview
│   │   └── policies/        # Policy management
│   ├── components/ui/       # Reusable UI components
│   └── lib/                 # API client (api.ts) & utils
```

## Getting Started

### Prerequisites
-   Node.js & npm (Frontend)
-   Python 3.10+ & pip (Backend)
-   MongoDB (Running locally or cloud URI)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Future Roadmap
-   **Real OCR Integration**: Replace simulated verification with real document parsing using Tesseract or cloud vision APIs.
-   **Auth Integration**: Replace mock auth with NextAuth.js and JWTs.
-   **Policy Rules Engine**: Implement a configurable rules engine for complex policy logic.
