# 📚 IIIT Surat Library Management System

A full-stack Library Management System built for IIIT Surat with role-based access for **Students** and **Librarians**.

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | React (Vite) + Tailwind CSS + React Router      |
| Backend        | Node.js + Express.js                            |
| Database       | MongoDB (Mongoose)                              |
| Auth           | JWT (jsonwebtoken + bcryptjs)                   |
| QR Code        | html5-qrcode (scanner) + qrcode (generator)    |
| Image Upload   | Multer                                          |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+ installed
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone and Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env` (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_iiitsurat
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
```

### 3. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm start        # or: npm run dev (with nodemon)

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

---

## 👤 User Roles

### Student
- View dashboard (issued books, dues, fines)
- Search & reserve books
- View issue history
- Dark mode toggle

### Librarian (Admin)
- Add/Edit/Delete books with image upload
- Generate QR codes for book copies
- Scan QR to issue/return books
- View overdue books & fine collection
- Export transaction data to CSV

---

## 💰 Fine System
- **₹5 per day** late (auto-calculated)
- Fines calculated on return or displayed for overdue active issues

---

## 🔐 Authentication
- Only `@iiitsurat.ac.in` emails allowed
- JWT-based authentication with role-based route protection
- Passwords hashed with bcrypt
- **Forgot password:** `/forgot-password` sends a one-hour reset link (SMTP required). The link uses **`CLIENT_URL`** if set; on **Render**, **`RENDER_EXTERNAL_URL`** is used automatically so reset works from **any phone / any network** without same Wi‑Fi. Set `CLIENT_URL` for a custom domain or local dev.

---

## 📧 Email reminders (optional)

Configure SMTP in `backend/.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc. — see `.env.example`). A daily job (default **9:00** server time, override with `DUE_REMINDER_CRON`) sends:

- **One day before due date (IST):** “Book due tomorrow” (once per issue).
- **After due date (IST):** first **overdue** notice (once per issue until returned).

On hosts that sleep (e.g. Render free), use an external cron to **POST** `/api/internal/due-reminders` with header `x-cron-secret` matching `CRON_SECRET`. See `DEPLOY.md`.

**Test “due tomorrow” email locally:** from `backend`, run `npm run test:predue` — it sets the latest **issued** transaction’s due date to **tomorrow (IST)**, clears the reminder flag, and runs the job once (needs SMTP in `.env` and at least one issued book).

---

## 📁 Project Structure

```
backend/
├── config/db.js           # MongoDB connection
├── controllers/
│   ├── authController.js  # Register, Login, GetMe
│   ├── bookController.js  # CRUD, Reserve, QR
│   └── transactionController.js # Issue, Return, Fines, Export
├── middleware/
│   ├── auth.js            # JWT verify + role check
│   └── upload.js          # Multer image upload
├── models/
│   ├── User.js
│   ├── Book.js
│   └── Transaction.js
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   └── transactionRoutes.js
├── server.js
├── .env
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DashboardLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── student/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BookSearch.jsx
│   │   │   └── IssueHistory.jsx
│   │   └── librarian/
│   │       ├── Dashboard.jsx
│   │       ├── AddBook.jsx
│   │       ├── EditBook.jsx
│   │       ├── ManageBooks.jsx
│   │       ├── QRScanner.jsx
│   │       ├── OverdueBooks.jsx
│   │       ├── FineCollection.jsx
│   │       └── ExportData.jsx
│   ├── services/api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 📡 API Documentation

### Auth (`/api/auth`)

| Method | Endpoint    | Access | Description          |
| ------ | ----------- | ------ | -------------------- |
| POST   | `/register`        | Public | Register new user              |
| POST   | `/login`           | Public | Login                          |
| POST   | `/forgot-password` | Public | Request reset email (`email`)  |
| POST   | `/reset-password`  | Public | Set new password (`token`, `password`) |
| GET    | `/me`              | Auth   | Get current user               |

### Books (`/api/books`)

| Method | Endpoint               | Access    | Description               |
| ------ | ---------------------- | --------- | ------------------------- |
| GET    | `/`                    | Auth      | List books (search+page)  |
| GET    | `/:id`                 | Auth      | Get single book           |
| POST   | `/`                    | Librarian | Add book (multipart)      |
| PUT    | `/:id`                 | Librarian | Update book               |
| DELETE | `/:id`                 | Librarian | Delete book               |
| POST   | `/reserve/:id`         | Student   | Reserve book              |
| GET    | `/qr/:id/:copyNumber`  | Librarian | Generate QR code          |

### Transactions (`/api/transactions`)

| Method | Endpoint    | Access    | Description            |
| ------ | ----------- | --------- | ---------------------- |
| POST   | `/issue`    | Librarian | Issue book (QR data)   |
| POST   | `/return`   | Librarian | Return book            |
| GET    | `/my`       | Auth      | Student's history      |
| GET    | `/overdue`  | Librarian | Overdue books list     |
| GET    | `/fines`    | Librarian | Fine collection data   |
| GET    | `/export`   | Librarian | Export CSV             |
| GET    | `/stats`    | Auth      | Dashboard statistics   |

---

## 📦 MongoDB Schemas

### User
`name`, `email` (@iiitsurat.ac.in), `password` (hashed), `role` (student/librarian)

### Book
`title`, `author`, `isbn`, `image`, `totalCopies`, `availableCopies`, `rackLocation`, `reservedBy[]`

### Transaction
`user` (ref), `book` (ref), `copyNumber`, `issueDate`, `dueDate` (14 days), `returnDate`, `fine`, `status` (issued/returned/overdue)
