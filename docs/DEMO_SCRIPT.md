# EduManage – 3–5 Minute Demonstration Video Script
**ALGIONS AI LABS PRIVATE LIMITED – Full-Stack Web Development Assessment**

**Presenter**: Full-Stack Software Engineer  
**Target Duration**: 3 minutes 45 seconds – 4 minutes 30 seconds  
**Application URL**: `http://localhost:5173`  

---

## Video Setup & Requirements
- Open browser at `http://localhost:5173/login`.
- Ensure server is running on `http://localhost:5000` with seeded database data.

---

## Scene 1: Introduction & Architecture Overview (0:00 – 0:30)
**Visual**: Start on `/login` screen showing the EduManage Portal interface with the three one-click demo role buttons.  
**Spoken Dialogue**:
> "Hello! Welcome to the technical demonstration of EduManage, a comprehensive, production-grade School Management System developed for the ALGIONS AI LABS Full-Stack Web Development assessment.
> 
> EduManage is built on a modern TypeScript stack: React with Vite and Tailwind CSS on the frontend, and Node.js with Express and Prisma ORM on the backend. It features multi-layered server-side role-based access control, PostgreSQL data models, automated transaction handling, and strict data isolation across Administrators, Teachers, and Guardians. Let's dive right in."

---

## Scene 2: Admin Persona & Creating a Student (0:30 – 1:15)
**Visual**: Click the **Admin** one-click button (`admin@edumanage.academy`), click **Sign In**. Dashboard loads with real database charts and KPIs. Navigate to **Students** tab and open the **Enroll New Student** modal. Fill in:
- Admission Number: `ADM-2026-101`
- Full Name: `Zachary Taylor`
- DOB: `2010-03-15`
- Gender: `Male`
- Class: `Class 10`
- Section: `Section A`
- Guardian: Link to `David Wilson`
Click **Save Student Record**. Table immediately displays Zachary Taylor with `ACTIVE` badge.

**Spoken Dialogue**:
> "Logging in as the Administrator, we are greeted with real-time analytics pulled directly from the database—including total enrollments, active faculty, today's roll call percentage, and financial ledgers.
> 
> In the Student Directory, we can manage student lifecycles. I'll enroll a new student, Zachary Taylor, into Class 10-A, linking him to registered parent David Wilson. The system enforces database-level uniqueness on admission numbers, preventing conflicts. We submit, and Zachary is now registered and enrolled in Class 10-A."

---

## Scene 3: Teacher Persona & Recording Daily Attendance (1:15 – 2:05)
**Visual**: Sign out from Admin. Click **Teacher** one-click button (`sarah.jenkins@edumanage.academy`), click **Sign In**.  
Navigate to **Take Daily Roll Call** (`/teacher/attendance`).
Select:
- Assigned Cohort: `Class 10 - Section A (Mathematics)`
- Instructional Date: Today
- Session: `Morning Session`  
Toggle student Bob Smith to `LATE` with remark: *"Traffic delay"*. Toggle Alice to `PRESENT`. Click **Submit Attendance Roster**. Green confirmation banner displays summary: 1 Present, 1 Late.

**Spoken Dialogue**:
> "Now, we log in as Teacher Sarah Jenkins. Notice that Sarah's dashboard is scoped only to her assigned curriculum classes: Class 10-A, 10-B, and 9-A Mathematics.
> 
> Let's record the morning roll call for Class 10-A. The roster dynamically displays all enrolled students. We'll mark Alice as Present and Bob as Late due to a bus delay. When we submit, the backend executes an atomic transaction with a unique composite constraint on (studentId, date, session). If we ever need to update roll call later today, the system executes an idempotent upsert rather than failing on duplicate keys."

---

## Scene 4: Teacher Marks Entry & Server Validation (2:05 – 2:45)
**Visual**: Navigate to **Marks Entry** (`/teacher/marks`).  
Select `Mid-Term Examination 2026` and `Class 10: Mathematics (Max Marks: 100)`.  
Enter `98` for Alice Smith. Demonstrate entering `105`—system highlights the field in red with warning *"Exceeds 100 max"*. Correct back to `98` and click **Submit & Calculate Results**. Green success alert appears.

**Spoken Dialogue**:
> "Next, Sarah records marks for the Mid-Term Examination in Mathematics. The maximum marks are configured at 100.
> 
> Notice what happens if a teacher mistakenly enters 105: the system immediately flags the violation, and even if an API call were forged, the backend strictly rejects any score exceeding maximum marks or below zero with an HTTP 400 error. We submit the valid marks, and the backend grading engine automatically calculates percentages and grade points."

---

## Scene 5: Guardian Persona, Multi-Child Switcher & PDF Report Card (2:45 – 3:30)
**Visual**: Sign out from Teacher. Click **Guardian** one-click button (`john.smith.parent@example.com`), click **Sign In**.  
Show the top navigation bar with the student switcher: `Alice Smith (Class 10-A)` and `Bob Smith (Class 10-A)`. Toggle between them.  
Navigate to **Report Cards** (`/guardian/results`). View the subject scores: Math (95), Science (92), English (88), Total 275/300, 91.67%, Grade: `A+`, Status: `PASSED`.  
Click **Download Official PDF Report Card**. PDF opens displaying school header, student info, marks table, and signature blocks.

**Spoken Dialogue**:
> "Now let's switch to Guardian John Smith. John has two children enrolled in the school: Alice and Bob. Notice our child switcher in the top navigation allows John to switch between his children instantly.
> 
> Under Report Cards, John sees Alice's verified marks for the Mid-Term Examination: 91.67% and an overall grade of A+. With one click, John can generate and download the official PDF report card, complete with institutional letterhead, subject breakdowns, and signature lines."

---

## Scene 6: Fee Statement, Simulated Payments & Security Isolation (3:30 – 4:15)
**Visual**: Navigate to **Fees & Invoices** (`/guardian/fees`).  
Select Bob Smith using the switcher. Show Invoice `INV-2026-0002`: Total $3,200, Paid $1,600, Outstanding $1,600.  
Click **Pay Now**. In the modal, select `UPI (Simulation)`, enter `$600`, and click **Confirm Payment**.  
Invoice updates in real-time to: Paid $2,200, Balance Due $1,000, Status: `PARTIALLY_PAID`.  
Now demonstrate access restriction: manually try to access Carlos Garcia's profile `/admin/students/<carlos-id>` while logged in as Guardian John. Screen displays **Access Denied (403 Forbidden)**.

**Spoken Dialogue**:
> "Finally, let's look at the financial ledger. Switching to Bob, John sees an active invoice with an outstanding balance of $1,600. John initiates a simulated payment of $600 via UPI.
> 
> The backend wraps the payment ledger creation and invoice balance decrement in a database transaction protected by an idempotency key. The balance updates instantly to $1,000.
> 
> Critical Security Requirement: John can only view his own children. If John tries to tamper with the URL to view Carlos Garcia's records, our backend authorization middleware intercepts the request and strictly denies access with a 403 Forbidden.
> 
> All 15 automated acceptance tests have run and passed. Thank you for your time!"
