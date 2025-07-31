package repository

import (
	"database/sql"
	"planify/backend/internal/model"
)

type ProjectRepository struct {
	DB *sql.DB
}

func (r *ProjectRepository) GetAll() ([]model.Project, error) {
	rows, err := r.DB.Query("SELECT id, name, description, created_at FROM projects")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}

	return projects, nil
}

func (r *ProjectRepository) GetByID(id int) (map[string]interface{}, error) {
	projectData := make(map[string]interface{})

	var name, description string
	var dueDate sql.NullString 
	query := "SELECT name, description, created_at FROM projects WHERE id = ?"
	err := r.DB.QueryRow(query, id).Scan(&name, &description, &dueDate)
	if err != nil {
		return nil, err
	}
	projectData["id"] = id
	projectData["name"] = name
	projectData["description"] = description
	projectData["dueDate"] = dueDate.String

	var team []model.User
	memberQuery := `
		SELECT u.id, u.name, u.email 
		FROM users u
		JOIN project_members pm ON u.id = pm.user_id
		WHERE pm.project_id = ?`
	rows, err := r.DB.Query(memberQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var user model.User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
			return nil, err
		}
		team = append(team, user)
	}
	projectData["team"] = team

	var columns []map[string]interface{}
	boardQuery := "SELECT id, title FROM boards WHERE project_id = ? ORDER BY position"
	boardRows, err := r.DB.Query(boardQuery, id)
	if err != nil {
		return nil, err
	}
	defer boardRows.Close()

	for boardRows.Next() {
		var boardID int
		var boardTitle string
		if err := boardRows.Scan(&boardID, &boardTitle); err != nil {
			return nil, err
		}

		var tasks []map[string]interface{}
		taskQuery := "SELECT id, title, description FROM tasks WHERE board_id = ? ORDER BY position"
		taskRows, err := r.DB.Query(taskQuery, boardID)
		if err != nil {
			return nil, err
		}
		
		for taskRows.Next() {
			var taskID int
			var taskTitle, taskDesc string
			if err := taskRows.Scan(&taskID, &taskTitle, &taskDesc); err != nil {
				return nil, err
			}
			
			var assignees []model.User
			assigneeQuery := `
				SELECT u.id, u.name, u.email
				FROM users u
				JOIN task_assignees ta ON u.id = ta.user_id
				WHERE ta.task_id = ?`
			assigneeRows, err := r.DB.Query(assigneeQuery, taskID)
			if err != nil {
				return nil, err
			}
			for assigneeRows.Next() {
				var user model.User
				if err := assigneeRows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
					return nil, err
				}
				assignees = append(assignees, user)
			}
			assigneeRows.Close()


			taskData := map[string]interface{}{
				"id":          taskID,
				"title":       taskTitle,
				"description": taskDesc,
				"assignees":   assignees,
			}
			tasks = append(tasks, taskData)
		}
		taskRows.Close()

		columnData := map[string]interface{}{
			"id":    boardID,
			"title": boardTitle,
			"tasks": tasks,
		}
		columns = append(columns, columnData)
	}
	projectData["columns"] = columns

	return projectData, nil
}