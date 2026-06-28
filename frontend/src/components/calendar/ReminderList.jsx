import React from 'react';
import { format } from 'date-fns';
import ReminderCard from './ReminderCard';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';

const ReminderList = ({ selectedDate, reminders, onAdd, onEdit, onDelete }) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todaysReminders = reminders.filter(r => r.date === dateStr);

  return (
    <div className="w-80 bg-[#1e1e2e] border border-gray-800 rounded-xl flex flex-col h-full shadow-2xl">
      <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#11111b] rounded-t-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-100">{format(selectedDate, 'MMMM d')}</h2>
          <p className="text-sm text-gray-400">{format(selectedDate, 'EEEE')}</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-gradient-to-r from-[#cba6f7] to-[#89b4fa] p-2 rounded-lg text-[#11111b] hover:shadow-lg transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <Droppable droppableId={dateStr}>
        {(provided, snapshot) => (
          <div 
            className={`flex-1 p-4 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-gray-800/30' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {todaysReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm">No reminders for this day.</p>
                <button onClick={onAdd} className="text-blue-400 mt-2 text-sm hover:underline">Create one</button>
              </div>
            ) : (
              todaysReminders.map((rem, index) => (
                <ReminderCard 
                  key={rem.id} 
                  reminder={rem} 
                  index={index} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default ReminderList;
