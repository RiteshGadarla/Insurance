# Insurance Claim Verification Platform

## Setup and Installation

### 1. Frontend Setup
Navigate to the frontend directory and install the necessary dependencies:

```bash
cd frontend
npm install
```

### 2. Backend Setup
Navigate to the backend directory and set up a virtual environment:

```bash
cd backend
```

#### Create Virtual Environment
- **Ubuntu/macOS**:
  ```bash
  python3 -m venv .venv
  ```
- **Windows**:
  ```bash
  python -m venv .venv
  ```

#### Activate Virtual Environment
- **Ubuntu/macOS**:
  ```bash
  source .venv/bin/activate
  ```
- **Windows (Command Prompt)**:
  ```bash
  .venv\Scripts\activate.bat
  ```
- **Windows (PowerShell)**:
  ```bash
  .venv\Scripts\Activate.ps1
  ```

#### Install Dependencies
Once the virtual environment is activated, install the required packages:

```bash
pip install -r requirements.txt
```

#### Seed Admin User
Initialize the database with a default admin user:

```bash
python seed_admin.py
```

### 3. Running the Project
Navigate back to the project root directory and start both the frontend and backend servers concurrently:

Install dependencies to run concurrently

```bash
npm i
```

```bash
npm run dev
```

This command will start:
- **Frontend** at `http://localhost:3000`
- **Backend API** at `http://localhost:8000`
