package model

type UserTask struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	ProjectID   int      `json:"projectId"`
	ProjectName string   `json:"projectName"`
	StatusName  string   `json:"statusName"`
	DueDate     *string  `json:"dueDate"`
}

type Attachment struct {
	ID       int    `json:"id"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
	URL      string `json:"url"`
}

type TaskComment struct {
	ID        int    `json:"id"`
	Text      string `json:"text"`
	CreatedAt string `json:"createdAt"`
	Author    *User  `json:"author,omitempty"`
}

type TaskDetail struct {
	ID            int           `json:"id"`
	Title         string        `json:"title"`
	Description   *string       `json:"description"`
	ProjectID     int           `json:"projectId"`
	ProjectName   string        `json:"projectName"`
	StatusID      int           `json:"statusId"`
	StatusName    string        `json:"statusName"`
	DueDate       *string       `json:"dueDate"`
	Assignees     []User        `json:"assignees"`
	Collaborators []User        `json:"collaborators"`
	Attachments   []Attachment  `json:"attachments"`
	Comments      []TaskComment `json:"comments"`
}
