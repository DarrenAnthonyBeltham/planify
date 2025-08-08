package model

type UserTask struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	ProjectID   int     `json:"projectId"`
	ProjectName string  `json:"projectName"`
	StatusName  string  `json:"statusName"`
	DueDate     *string `json:"dueDate"`
}
