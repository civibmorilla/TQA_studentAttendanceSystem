# 🎓 Attendify — Student Attendance System

A comprehensive MERN-stack web application designed for secure, role-based academic attendance tracking. This project is developed for Test and Quality Assurance (TQA) to demonstrate robust UI/UX implementation, systemic routing, and API integration.

## 🎨 UI/UX Design System & Screenshots

Our team finalized high-fidelity interface prototypes for all three user roles: **Admin**, **Instructor**, and **Student**.

### 🔐 Multi-Role Authentication
| Portal Login (`web-login.png`) |
| :---: |
| <img src="./docs/screenshots/01-login.png" width="600" alt="Login Portal"/> |

---

### 👨‍💼 School Administrator View
| School Admin Dashboard (`web-admin-dashboard.png`) |
| :---: |
| <img src="./docs/screenshots/02-admin-dashboard.png" width="700" alt="Admin Dashboard"/> |

---

### 👨‍🏫 Instructor / Teacher View
| Daily Attendance Sheet (`web-instructor-dashboard.png`) | Instructor Profile (`web-instructor-profile.png`) |
| :---: | :---: |
| <img src="./docs/screenshots/03-instructor-dashboard.png" width="450" alt="Instructor Dashboard"/> | <img src="./docs/screenshots/04-instructor-profile.png" width="450" alt="Instructor Profile"/> |

---

### 👨‍🎓 Student View
| Student Dashboard (`web-student-dashboard.png`) | Enrolled Subjects (`web-my-subjects.png`) |
| :---: | :---: |
| <img src="./docs/screenshots/05-student-dashboard.png" width="450" alt="Student Dashboard"/> | <img src="./docs/screenshots/06-student-subjects.png" width="450" alt="Student Subjects"/> |

| Attendance Timeline (`web-attendance-detail.png`) | Student Profile (`web-student-profile.png`) |
| :---: | :---: |
| <img src="./docs/screenshots/07-student-attendance.png" width="450" alt="Student Attendance"/> | <img src="./docs/screenshots/08-student-profile.png" width="450" alt="Student Profile"/> |


**🚀 Live Front-End Demo:** [https://tqa-student-attendance-system.vercel.app](https://tqa-student-attendance-system.vercel.app)

---

## 🛠️ Technology Stack

**Front-End (Client)**
* **Framework:** React 18 + Vite
* **Styling:** Tailwind CSS v4
* **Routing:** React Router DOM v6
* **HTTP Client:** Axios
* **Deployment:** Vercel (Configured with `vercel.json` for SPA routing)

**Back-End (Server)**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs
* **Environment:** dotenv, cors

---

## 🌟 System Portals & Features

1. **Student Portal:**
   * Dynamic attendance dashboard with overall percentage tracking.
   * Low-attendance target warnings (<80%).
   * Privacy-toggled user profiles masking sensitive contact information.
   * Enrolled subjects overview with schedule and room assignments.

2. **Instructor Portal:**
   * Daily attendance sheet management with intuitive Present (P), Late (L), Absent (A) toggles.
   * Roster filtering by Program, Year Level, Section, and Subject.
   * Instructor schedule and assigned cohort tracking.

3. **Admin Portal:**
   * High-level system overview (Active Programs, Total Instructors, Scheduled Classes).
   * Account Management Panel for creating, editing, and deactivating user accounts.
   * Program Management for configuring academic course streams.

---

## 📂 Project Structure

This repository is organized as a monorepo, separating the front-end client and back-end server into distinct environments.

```text
TQA_studentAttendanceSystem/
├── client/                     # React/Vite Front-End
│   ├── src/
│   │   ├── components/         # Shared UI (Sidebar, BrandLogo)
│   │   ├── pages/              # Portal Views (Admin, Instructor, Student)
│   │   ├── services/           # Axios API Interceptors
│   │   ├── App.jsx             # React Router Configuration
│   │   └── index.css           # Tailwind v4 Directives
│   ├── package.json
│   ├── vite.config.js          # Vite & Tailwind Plugin Config
│   └── vercel.json             # SPA Routing Rules
│
└── server/                     # Node/Express Back-End
    ├── config/                 # DB Connection
    ├── controllers/            # API Route Logic
    ├── middleware/             # JWT & RBAC Security Checks
    ├── models/                 # Mongoose Schemas
    ├── routes/                 # Express API Endpoints
    ├── .env.example
    ├── package.json
    └── server.js               # Express Application Entry