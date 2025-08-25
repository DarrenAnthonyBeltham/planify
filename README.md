# Planify: Smart Task & Project Management
Welcome to the official repository for the **Planify** project. This project is a productivity-focused web application for managing tasks, projects, and team collaboration. It features a responsive, interactive frontend with real-time boards and a robust backend API for secure data management, making teamwork more organized and efficient.

---
## Project Overview
Planify is designed to be a lightweight yet powerful project management solution. It provides Kanban-style boards, customizable task priorities, drag-and-drop task organization, user profiles, comments, file attachments, and team project views. The platform is split into two main components: a **React + TypeScript frontend** and a **Go backend API**.

---
## Project Structure
The repository is organized into two primary directories, separating the frontend and backend concerns:
* **/frontend**: The client-facing web application built with React + TypeScript. Handles all UI, animations, and client-side logic.
* **/backend**: The Go-based backend API service, responsible for authentication, business logic, task/project management, and database interactions.

---
## Technologies Used
### Frontend ( /frontend )
* **React + TypeScript**: Modern, type-safe frontend development.
* **Tailwind CSS**: Utility-first CSS for fast, responsive, and consistent UI.
* **dnd-kit**: Drag-and-drop task cards across project columns.
* **Lucide-react**: Icon set for clean, consistent visuals.
* **Vite**: Lightning-fast build tool and dev server.

### Backend ( /backend )
* **Go (Golang)**: High-performance backend language for scalability and reliability.
* **Gin Framework**: HTTP web framework used for routing and middleware.
* **MySQL**: Relational database for storing projects, tasks, users, and settings.
* **JWT Authentication**: Secure token-based authentication for protected API routes.
* **go-sql-driver/mysql**: MySQL driver for database connectivity.

---
## Key Features
* **Kanban Board View**: Drag and drop tasks between project columns (To Do, In Progress, Done, etc.).
* **Task Management**: Create, edit, delete tasks with priorities, due dates, and assignees.
* **Project Management**: Create and organize multiple projects with team collaboration.
* **User Profiles**: View and edit profile info, upload avatars, and see user-specific tasks.
* **Comments & Attachments**: Add task comments and upload files for better collaboration.
* **Search Bar**: Search projects, tasks, and users directly from the navbar.
* **Settings**: Customize notifications, themes, and collaboration preferences.
* **Authentication**: Secure login & registration using JWT.
