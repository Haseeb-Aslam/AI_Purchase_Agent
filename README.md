# AI Purchase Agent & Procurement Analytics Dashboard

Full-stack e-commerce procurement system with an AI Purchase Agent and analytics dashboard.

## Features

### AI Purchase Agent
- **Chat interface** – Ask questions about suppliers, reorders, low stock, budgets (admin panel)
- **Reorder alerts** – Demand-based low-stock alerts and recommended reorder quantities
- **Supplier recommendations** – Compare vendors by price, delivery, reliability
- **Cost optimization** – Budget monitoring and cost-saving insights
- **RFQ drafting** – AI-generated request-for-quotation templates
- **PO drafting** – Draft POs from line items, export PDF
- **RFQ drafting** – AI-generated request-for-quotation messages (tone & strategy)
- **Supplier performance** – Delivery, accuracy, lead time tracking
- **Configurable AI** – Forecast sensitivity, budget limits, vendor weights in admin

### Procurement Analytics Dashboard
- **Overview** – Total spend, orders, avg cost, budget utilization
- **Purchase trends** – Daily/weekly/monthly time series
- **Inventory & reorder** – Low stock, reorder frequency
- **Supplier performance** – On-time delivery, cost comparison, reliability
- **Cost breakdown** – By category, top SKUs
- **AI agent performance** – Forecast accuracy, cost savings
- **Export** – PDF/CSV reports

## Tech Stack

- **Backend:** Python, FastAPI, MongoDB (Motor), OpenAI / LangChain
- **Frontend:** React, TypeScript, Vite, Recharts
- **Data:** CSV/Excel import from project folder

## Run with Docker (recommended)

One command to run the full stack (MongoDB + backend + frontend) in the terminal:

```bash
# From project root (ensure backend/.env exists with OPENAI_API_KEY and MONGODB_URI if needed)
docker compose up --build
```

Then open **http://localhost:8000** in your browser. The app serves the UI and API from the same port.

**Important:**
1. **Import data first** – Go to **Import Data** and click **Import All** so the dashboard and AI agent have data (your CSV files are mounted from the project folder).
2. **AI agent** – Put your OpenAI key in **`backend/.env`** (same file used for local runs):  
   `OPENAI_API_KEY=sk-your-key`  
   Docker Compose passes this into the app. Restart the stack after adding or changing it: `docker compose up --build`.

Stop with `Ctrl+C` or run in background: `docker compose up -d`.

---

## Prerequisites (without Docker)

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key (for AI chat, RFQ, and agent features)

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=ai_purchase_agent
OPENAI_API_KEY=sk-your-key
```

Start MongoDB, then run:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Import data

With backend and MongoDB running, open the app and go to **Import Data**. Click **Import All** to load the CSV files from the project root into MongoDB. Alternatively:

```bash
curl -X POST "http://localhost:8000/api/import/all"
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The dev server proxies `/api` to the backend.

## Project structure

```
AI_Purchase_Agent/
├── Dockerfile              # Multi-stage: build frontend + backend, serve both
├── docker-compose.yml      # MongoDB + app (run with: docker compose up)
├── backend/
│   ├── main.py           # FastAPI app
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── routes/           # data_import, analytics, ai_agent
│   └── services/         # csv_import, ai_agent, analytics
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/
│   │   └── pages/        # Dashboard, AgentChat, ReorderAlerts, etc.
│   └── package.json
├── *.csv                 # Data files (suppliers, products, purchase_orders, etc.)
└── README.md
```

## API overview

- `POST /api/import/all` – Import all CSVs into MongoDB
- `GET /api/analytics/overview?period=YYYY-MM` – Procurement overview
- `GET /api/analytics/purchase-trends` – Time-series trends
- `GET /api/analytics/inventory-reorder` – Low stock items
- `GET /api/analytics/supplier-performance` – Supplier metrics
- `GET /api/analytics/cost-breakdown` – Category and SKU spend
- `GET /api/analytics/ai-agent-performance` – AI forecast/savings
- `GET /api/analytics/export/report` – Export JSON/CSV
- `POST /api/agent/chat` – AI chat
- `GET /api/agent/reorder-alerts` – Reorder alerts
- `GET /api/agent/suppliers/recommend` – Ranked suppliers
- `GET /api/agent/forecast/{sku_id}` – Demand forecast
- `POST /api/agent/rfq/draft` – RFQ draft
- `POST /api/agent/po/draft` – PO draft
- `GET /api/agent/config` / `PUT /api/agent/config` – AI settings

API docs: http://localhost:8000/docs

## Data files (project root)

Place or keep these CSVs in the project root for import:

- `suppliers.csv`
- `products.csv`
- `purchase_orders.csv`
- `sales_history.csv`
- `inventory_snapshots.csv`
- `budget_spend.csv`
- `supplier_performance.csv`
- `ai_agent_logs.csv` (optional)

Column names are normalized to lowercase with spaces replaced by underscores during import.
