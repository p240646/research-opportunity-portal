-- Database Schema for University Research Opportunity Portal
-- Assignment 1

CREATE DATABASE IF NOT EXISTS research_db;
USE research_db;

DROP TABLE IF EXISTS opportunities;

CREATE TABLE opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    research_title VARCHAR(255) NOT NULL,
    research_description TEXT NOT NULL,
    research_area VARCHAR(100) NOT NULL,
    faculty_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    required_skills TEXT NOT NULL,
    available_positions INT NOT NULL,
    application_deadline DATE NOT NULL,
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open'
);

-- Sample Data
INSERT INTO opportunities (research_title, research_description, research_area, faculty_name, department, required_skills, available_positions, application_deadline, status)
VALUES 
('Deep Learning for Cancer Detection', 'Investigating convolutional neural networks for histopathological image analysis.', 'Biomedical AI', 'Dr. Sarah Jenkins', 'Computer Science', 'Python, PyTorch, OpenCV', 2, '2026-11-30', 'Open'),
('Smart Grid Energy Optimization', 'Developing distributed edge protocols for renewable microgrids.', 'IoT & Power Systems', 'Prof. Marcus Chen', 'Electrical Engineering', 'C++, IoT, MATLAB', 3, '2026-10-15', 'Open'),
('Quantum Key Distribution in Optics', 'Simulating atmospheric turbulence mitigation in free-space optical channels.', 'Quantum Computing', 'Dr. Elena Rostova', 'Physics', 'Python, Quantum Physics, Optics', 1, '2026-09-01', 'Closed');
