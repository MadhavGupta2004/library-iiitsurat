# IIIT Surat Library Management System — Presentation Guide

**For non-technical audience: focus on flow, purpose, and outcomes.**

---

## 1. What Is This Project?

- **Name:** Library Management System for IIIT Surat  
- **Purpose:** A **web application** that helps the institute library manage books, issue/return, track fines, and lets students search books and pay fines online.  
- **Users:** Two types — **Students** and **Librarians (admin)**.  
- **Outcome:** Less manual work, faster issue/return, clear records, and online fine payment.

---

## 2. High-Level Workflow (How It Works)

### Overall Flow in Simple Steps

1. **User opens the website** → Sees Login or Register.
2. **Registration** → Only allowed if the person’s email is **@iiitsurat.ac.in** and the librarian has **pre-approved** that email. Role (student/librarian) is fixed by admin.
3. **Login** → User enters email and password. System checks and sends them to:
   - **Student dashboard** (search books, see issued books, pay fines), or  
   - **Librarian dashboard** (add books, issue/return, see overdue, collect fines, export data).
4. **Students** → Search books, see what they have issued, see dues/fines, pay fines online (Razorpay).
5. **Librarians** → Add/edit books, issue books (by scanning QR or selecting student + book), return books, see overdue list, view fine collection, export transaction/payment data to CSV.

### Flow Diagram (Explain in Words)

- **Start** → Login/Register (only institute emails, pre-approved list).  
- **After login** → Student goes to student area; Librarian goes to librarian area.  
- **Student flow:** Dashboard → Book search → (optional) Reserve → View issue history → Pay fines online.  
- **Librarian flow:** Dashboard → Add/Manage books → Issue book (QR or manual) → Return book → Overdue books → Fine collection → Export data / View payments.

---

## 3. Most Important Points to Tell

### 3.1 Security & Access

- Only **@iiitsurat.ac.in** emails can register.  
- Not everyone can register: **librarian first adds allowed users**; only those can create an account.  
- **Roles are fixed** at registration (student or librarian); users cannot change their own role.  
- **Passwords are stored securely** (hashed); **login uses tokens** so only logged-in users can access their pages.

### 3.2 Two Sides: Student vs Librarian

**Student side:**

- View **dashboard**: currently issued books, due dates, fines.  
- **Search books** by title/author/ISBN.  
- View **issue history**.  
- **Pay fines online** (Razorpay); view **payment history**.

**Librarian side:**

- **Add/Edit/Delete books** (with cover image, ISBN, copies, rack location).  
- **Issue book**: scan QR on book or select student + book and issue.  
- **Return book**: scan QR or enter details; system **calculates fine** if late.  
- **Overdue books**: list of all books not returned by due date.  
- **Fine collection**: view fines; students pay online; librarian can also **mark as paid manually**.  
- **Export**: export transactions and payments to **CSV** for records.  
- **Students list**: view registered students.  
- **Payments**: see all payments, export, download receipts.

### 3.3 Issue and Return Flow

- **Issue:** Librarian selects student and book (or scans QR). System checks: book available, student valid. It creates an **issue record** with **due date = 14 days** from issue. Available copies of the book are reduced by 1.  
- **Return:** Librarian marks the book as returned. System **calculates fine**: **₹5 per day** after due date. Fine is stored with the transaction. Student can pay online; librarian can mark paid manually.

### 3.4 Fine System

- **Rule:** **₹5 per day** for each day after the due date.  
- Fine is calculated **at return time** (for returned books) or **on demand** (for overdue issued books).  
- Students can **pay online** (Razorpay); librarian can **mark paid manually** for cash/other modes.  
- Payment history and receipts are available.

### 3.5 QR Code Usage (Optional to Mention)

- Each **book copy** can have a **QR code** (book + copy number).  
- Librarian can **scan QR** to quickly issue or return that copy — reduces manual entry and errors.

### 3.6 Reports & Export

- Librarian can **export transaction data** (issue/return) to **CSV**.  
- Librarian can **export payment data** to **CSV**.  
- Useful for **institute records and audits**.

---

## 4. What to Say Slide-by-Slide (Suggested)

### Slide 1: Title

- **Title:** Library Management System — IIIT Surat  
- **Say:** “We built a web-based library system for our institute. It has two types of users: students and librarians. The idea is to digitize issue, return, fines, and payments.”

### Slide 2: Problem & Solution

- **Problem:** Manual issue/return, paper records, no online fine payment, hard to track overdue.  
- **Solution:** One website where students and librarians do everything: issue, return, fines, online payment, and export of data.

### Slide 3: Who Uses It?

- **Students:** Login → see dashboard (issued books, dues) → search books → view history → pay fines online.  
- **Librarians:** Login → add/manage books → issue/return (with QR support) → see overdue → fine collection → export to CSV, manage payments.

### Slide 4: How Does a Book Get Issued?

- Librarian selects the student and the book (or scans the book’s QR).  
- System checks: book is available, student is valid.  
- System creates an issue record and sets **due date = 14 days**.  
- Available copies of that book are reduced by one.  
- Student sees the book on their dashboard.

### Slide 5: How Does Return & Fine Work?

- Librarian marks the book as returned.  
- If return is **after due date**, system calculates **fine = ₹5 × (number of days late)**.  
- Student can **pay online** (Razorpay) or librarian can **mark as paid manually**.  
- All payments and receipts can be viewed and exported.

### Slide 6: Security & Control

- Only **institute emails** (@iiitsurat.ac.in) can register.  
- **Pre-approved list**: librarian adds allowed users; only they can register.  
- **Role is fixed** (student/librarian) at registration.  
- Passwords are stored securely; access is token-based.

### Slide 7: Reports & Export

- Librarian can **export** issue/return **transactions** to CSV.  
- Librarian can **export payments** to CSV.  
- Helps in **record-keeping and audits** without focusing on code.

### Slide 8: Summary / Thank You

- **Summary:** One system for students (search, issue history, pay fines) and librarians (books, issue/return, overdue, fines, payments, export).  
- **Thank you.**

---

## 5. If They Ask “How Does It Work?” (No Code)

- **User opens the website** → browser talks to a **server**.  
- **Server** checks **database** (where books, users, transactions, payments are stored).  
- **Student/Librarian** see different screens based on their **role**.  
- **Issue:** Server creates a record, updates “available copies,” sets due date.  
- **Return:** Server updates the record, calculates fine.  
- **Payment:** Student pays via Razorpay; server records payment and can update “paid” status.  
- **Export:** Server reads data from database and generates CSV for download.

---

## 6. One-Page Cheat Sheet (Quick Reference)

| Topic              | What to say |
|--------------------|------------|
| **Project name**   | Library Management System for IIIT Surat |
| **Users**          | Students and Librarians (role-based) |
| **Student**        | Dashboard, search books, issue history, pay fines online |
| **Librarian**      | Add/manage books, issue/return (QR), overdue, fines, export CSV, payments |
| **Issue**          | Librarian selects student + book (or QR); due date 14 days; copies reduced |
| **Return**         | Librarian marks return; fine ₹5/day if late |
| **Fine payment**   | Online (Razorpay) or librarian marks paid manually |
| **Security**       | Only @iiitsurat.ac.in; pre-approved list; role fixed at registration |
| **Export**         | Transactions and payments to CSV for records |

---

*Use this guide to explain the **flow and purpose** of the system. Avoid code; focus on who does what, in what order, and what the system does with the data.*
