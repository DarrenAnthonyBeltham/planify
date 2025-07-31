import { useState, useEffect } from 'react';
import { Modal } from './modal';
import { CheckSquare, Trash2 } from 'lucide-react';

export function TaskDetailModal({ isOpen, onClose, task, projectMembers, onUpdateTask }: any) {
  const [currentTask, setCurrentTask] = useState(task);
  const [newSubTask, setNewSubTask] = useState('');

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const handleAssigneeChange = (memberId: number) => {
    const newAssignees = currentTask.assignees.includes(memberId)
      ? currentTask.assignees.filter((id: number) => id !== memberId)
      : [...currentTask.assignees, memberId];
    const updatedTask = { ...currentTask, assignees: newAssignees };
    onUpdateTask(updatedTask);
  };

  const handleSubTaskToggle = (subTaskId: string) => {
    const newSubTasks = currentTask.subTasks.map((st: any) => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    const updatedTask = { ...currentTask, subTasks: newSubTasks };
    onUpdateTask(updatedTask);
  };

  const handleAddSubTask = () => {
    if (newSubTask.trim() === '') return;
    const subTask = { id: `sub-${Date.now()}`, text: newSubTask, completed: false };
    const updatedTask = { ...currentTask, subTasks: [...currentTask.subTasks, subTask] };
    onUpdateTask(updatedTask);
    setNewSubTask('');
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const updatedTask = { ...currentTask, description: e.target.value };
      onUpdateTask(updatedTask);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentTask.title}>
      <div>
        <h4 className="font-semibold text-primary mb-2">Description</h4>
        <textarea
          value={currentTask.description}
          onChange={handleDescriptionChange}
          placeholder="Add a more detailed description..."
          className="w-full p-2 rounded-md bg-board border border-secondary/20 text-primary"
          rows={3}
        />
      </div>
      <div className="mt-4">
        <h4 className="font-semibold text-primary mb-2">Assignees</h4>
        {projectMembers.map((member: any) => (
          <label key={member.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-board">
            <input
              type="checkbox"
              checked={currentTask.assignees.includes(member.id)}
              onChange={() => handleAssigneeChange(member.id)}
            />
            <img className="w-8 h-8 rounded-full" src={member.avatar} alt={member.name} />
            <span className="text-sm text-primary">{member.name}</span>
          </label>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold text-primary mb-2">Checklist</h4>
        {currentTask.subTasks.map((st: any) => (
          <div key={st.id} className="flex items-center gap-2 p-1 rounded hover:bg-board">
             <input type="checkbox" checked={st.completed} onChange={() => handleSubTaskToggle(st.id)} />
             <span className={`flex-grow text-primary ${st.completed ? 'line-through text-secondary' : ''}`}>{st.text}</span>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              placeholder="Add an item"
              className="flex-grow p-2 rounded-md bg-board border border-secondary/20 text-primary"
            />
            <button onClick={handleAddSubTask} className="bg-accent text-white px-4 rounded-md">Add</button>
        </div>
      </div>
    </Modal>
  );
}