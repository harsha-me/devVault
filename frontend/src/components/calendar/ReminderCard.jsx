import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Edit2, Trash2, Clock, Bell } from 'lucide-react';

const ReminderCard = ({ reminder, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={reminder.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 rounded-xl border mb-3 group transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-2xl scale-105 z-50 bg-[#181825] border-blue-500' : 'bg-[#181825] border-gray-800 hover:border-gray-600'
          }`}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-200 truncate pr-2" style={{ color: reminder.reminderColor }}>{reminder.title}</h4>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
              <button onClick={(e) => { e.stopPropagation(); onEdit(reminder); }} className="text-gray-400 hover:text-blue-400"><Edit2 size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(reminder.id); }} className="text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
          {reminder.description && (
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{reminder.description}</p>
          )}
          <div className="flex flex-wrap gap-2 items-center text-xs">
            {reminder.time && (
              <span className="flex items-center gap-1 bg-[#11111b] text-gray-300 px-2 py-1 rounded-md">
                <Clock size={12} /> {reminder.time}
              </span>
            )}
            <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-md">{reminder.category}</span>
            <span className={`px-2 py-1 rounded-md font-semibold ${
              reminder.priority === 'High' ? 'bg-red-500/20 text-red-400' :
              reminder.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {reminder.priority}
            </span>
            {reminder.notificationEnabled && (
              <span className="text-blue-400" title={`Notifies ${reminder.notificationTime} before`}><Bell size={14} /></span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ReminderCard;
