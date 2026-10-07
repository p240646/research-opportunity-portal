# University Research Opportunity Portal
Assignment No. 1

## Student Information
- Course: Computer Networks (CN)
- Class: BS (CS 5B)
- University: National University of Computer & Emerging Sciences (FAST-NUCES), Peshawar Campus
- Student Name: Talha Az
- Reg. No: P24-0646
- GitHub Repository: https://github.com/p240646/research-opportunity-portal

---

## Project Overview
This project is a web-based University Research Opportunity Portal developed as part of Assignment 1. It provides a centralized platform for university faculty members to post, view, update, and manage research openings, and allows students to browse available opportunities.

The system consists of:
1. Backend REST API built with Python and Flask.
2. MySQL database for storing research opportunities.
3. Clean and functional frontend interface (HTML, CSS, JavaScript) communicating with the backend API.

---

## Technologies Used
- Backend: Python 3, Flask, mysql-connector-python
- Database: MySQL
- Frontend: HTML5, CSS3, JavaScript (Fetch API)
- API Testing: Postman

---

## Database Setup

1. Start your MySQL server (via XAMPP, MySQL Workbench, or command line).
2. Open MySQL and run the `schema.sql` script provided in the project root:
   ```sql
   source schema.sql;
   ```
   Or execute the SQL commands inside `schema.sql` to create the `research_db` database and `opportunities` table.

3. Verify database configuration in `database.py`:
   - Host: localhost
   - User: root
   - Password: [your_mysql_password]
   - Database: research_db

---

## How to Run the Application

1. Open a terminal in the project directory.

2. Activate the virtual environment (if using one):
   ```bash
   .\.venv\Scripts\activate
   ```

3. Install required dependencies:
   ```bash
   pip install Flask mysql-connector-python
   ```

4. Start the backend Flask server:
   ```bash
   python app.py
   ```

5. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## API Endpoints

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| POST | /api/opportunities | Create a new research opportunity | 201 Created / 400 Bad Request |
| GET | /api/opportunities | Retrieve all research opportunities | 200 OK |
| GET | /api/opportunities/:id | Retrieve a specific opportunity by ID | 200 OK / 404 Not Found |
| PUT | /api/opportunities/:id | Update an existing opportunity / status | 200 OK / 400 / 404 |
| DELETE | /api/opportunities/:id | Delete a research opportunity | 200 OK / 404 Not Found |

---

## Postman Testing
The exported Postman collection is included in the project:
`Research Opportunities API.postman_collection.json`

The collection tests:
1. Creating three research opportunities (POST)
2. Retrieving all opportunities (GET)
3. Retrieving one opportunity by ID (GET)
4. Updating an opportunity (PUT)
5. Changing status from Open to Closed (PUT)
6. Deleting an opportunity (DELETE)
7. Requesting the deleted opportunity to demonstrate 404 Not Found
8. Sending invalid data to demonstrate input validation (400 Bad Request)

---

## Demonstration Video
- Video Link: [Insert Google Drive / YouTube unlisted link here, or include video file in submission zip]
