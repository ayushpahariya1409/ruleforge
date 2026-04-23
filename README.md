# RuleForge | Advanced Order Evaluation Engine

RuleForge is a high-performance, aesthetically-driven rule engine designed to evaluate complex business logic against large order datasets. Built with a focus on speed, precision, and a premium user experience.

![Dashboard Preview](https://via.placeholder.com/1200x600.png?text=RuleForge+Dashboard+Preview)

## 🚀 Core Features

- **Dynamic Rule Builder**: Create, edit, and manage complex logical conditions with a high-fidelity visual interface.
- **Real-time Analytics**: Interactive charts (Area, Pie, Bar) powered by Recharts with synchronized "fill" animations and scroll-triggered reveals.
- **Multi-Database Support**: Backend logic intelligently switches between **MySQL** and **PostgreSQL (Neon)** based on your environment. Persistent storage via **MongoDB Atlas**.
- **High-Performance Evaluation**: Process thousands of records with optimized logic and clear "Matched vs. Unmatched" result tracking.
- **Dockerized Architecture**: Fully containerized setup using Docker and Nginx for production-grade serving.
- **Premium UI/UX**: Responsive design with cinematic scroll reveals, glassmorphism elements, and modern typography (Outfit/Inter).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Redux Toolkit, Recharts, Framer Motion.
- **Backend**: Node.js, Express, Sequelize (SQL), Mongoose (NoSQL), JWT Authentication.
- **Database**: MongoDB (Metadata/Results), MySQL/PostgreSQL (Rule Logic).
- **Infrastructure**: Docker, Nginx, GitHub Actions (CI/CD).

---

## 🚦 Quick Start (Docker)

The fastest way to get RuleForge running is using Docker Compose.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/rule-based-engine.git
   cd rule-based-engine
   ```

2. **Configure Environment**:
   - Create `backend/.env` (use `.env.example` as a template).
   - Create `frontend/.env` and set `VITE_API_URL=/api`.

3. **Launch with Docker**:
   ```bash
   docker-compose up --build -d
   ```

4. **Access the App**:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 👨‍💻 Local Development

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev # Runs on http://localhost:5173
```

---

## 📊 Data Schema
RuleForge expects order data in Excel (`.xlsx`) or CSV format with the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `orderId` | String | Unique identifier |
| `orderValue` | Number | Total monetary value |
| `region` | String | US, EU, APAC, etc. |
| `userType` | String | premium, wholesale, retail |
| `previousOrders`| Number | Total orders by the user |

---

## 🛡️ Security & Performance
- **Portals & Z-Index**: Optimized modal hierarchy to ensure system alerts always appear on top.
- **Selective Rendering**: Charts only mount and animate when visible to the user, saving browser resources.
- **Nginx Proxy**: Reverse proxying in Docker prevents CORS issues and improves load times for static assets.

---