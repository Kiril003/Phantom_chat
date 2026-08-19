import React, { useState } from 'react';
import { CheckSquare, Square, ListTodo, Plus, Calendar, User, Check } from 'lucide-react';
import { TaskListData, TaskItem } from '../types';
import { soundFx } from '../utils/sound';

interface TaskListEmbedProps {
  data: TaskListData;
  isSelf?: boolean;
  onUpdateTaskList?: (updated: TaskListData) => void;
}

export const TaskListEmbed: React.FC<TaskListEmbedProps> = ({ data, onUpdateTaskList }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(data.tasks || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleTask = (taskId: string) => {
    soundFx.playTap();
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    onUpdateTaskList?.({ ...data, tasks: updated });
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) {
      setIsAdding(false);
      return;
    }
    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      assigneeName: newAssignee.trim() || undefined,
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTitle('');
    setNewAssignee('');
    setIsAdding(false);
    soundFx.playTap();
    onUpdateTaskList?.({ ...data, tasks: updated });
  };

  return (
    <div className="space-y-3 pt-1 select-text">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#E8DFD1]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-[#FCE7D8] text-[#E87A42] rounded-xl shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-[#1F2521] leading-tight truncate">
              {data.title}
            </h4>
            <p className="text-[11px] text-[#717E75]">
              Виконано {completedCount} з {totalCount} ({progressPercent}%)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-2 py-1 bg-[#F2EDE4] hover:bg-[#E8DFC8] text-[#47534A] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0"
        >
          <Plus className="w-3 h-3 text-[#E87A42]" />
          <span>Задача</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE2D5] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#528A4B] h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Task Items */}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-all border ${
              task.completed
                ? 'bg-[#F2ECE1]/60 border-[#E2D7C5] text-[#7E8B82]'
                : 'bg-white hover:bg-[#FAF8F3] border-[#DFD6C5] text-[#1F2521] shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                className={`p-0.5 rounded transition-colors ${
                  task.completed ? 'text-[#528A4B]' : 'text-[#8E9B91]'
                }`}
              >
                {task.completed ? (
                  <CheckSquare className="w-4 h-4 fill-current" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span
                className={`text-xs font-medium truncate ${
                  task.completed ? 'line-through text-[#8C988F]' : ''
                }`}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {task.dueDate && (
                <span className="text-[10px] text-[#717E75] flex items-center gap-0.5 bg-[#FAF8F3] px-1.5 py-0.5 rounded-md border border-[#E3D9C9]">
                  <Calendar className="w-2.5 h-2.5" />
                  {task.dueDate}
                </span>
              )}
              {task.assigneeName && (
                <span className="text-[10px] font-semibold text-[#8C461A] bg-[#FCE7D8] px-2 py-0.5 rounded-md border border-[#F4C8AB]">
                  {task.assigneeName}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Inline Add Task Form */}
        {isAdding && (
          <div className="p-2.5 bg-[#FFFDF8] border-2 border-[#E87A42] rounded-xl space-y-2 shadow-xs">
            <input
              type="text"
              placeholder="Назва нової задачі..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-[#DFD6C5] rounded-lg text-xs focus:outline-none focus:border-[#E87A42]"
            />
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Виконавець (напр. Марта)"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#DFD6C5] rounded-lg text-xs w-48 focus:outline-none focus:border-[#E87A42]"
              />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 text-xs text-[#717E75] hover:bg-[#EFE8DC] rounded-lg"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleAddTask}
                  className="px-3 py-1 bg-[#E87A42] hover:bg-[#D46B35] text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Додати</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
