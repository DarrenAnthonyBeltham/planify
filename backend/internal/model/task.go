package model

type UserTask struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	ProjectID   int      `json:"projectId"`
	ProjectName string   `json:"projectName"`
	StatusName  string   `json:"statusName"`
	DueDate     *string  `json:"dueDate"`
}

type TaskDetail struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	Description *string  `json:"description"`
	ProjectID   int      `json:"projectId"`
	ProjectName string   `json:"projectName"`
	StatusID    int      `json:"statusId"`
	StatusName  string   `json:"statusName"`
	DueDate     *string  `json:"dueDate"`
	Assignees   []User   `json:"assignees"`
}
