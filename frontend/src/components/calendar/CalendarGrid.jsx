import React from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { Droppable } from '@hello-pangea/dnd';

const CalendarGrid = ({ currentDate, selectedDate, onDateClick, reminders }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      const dayReminders = reminders.filter(r => r.date === format(cloneDay, 'yyyy-MM-dd'));

      days.push(
        <Droppable droppableId={format(cloneDay, 'yyyy-MM-dd')} key={day.toString()}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[100px] p-2 border-r border-b border-gray-800 cursor-pointer transition-colors ${
                !isSameMonth(day, monthStart)
                  ? "bg-gray-900/50 text-gray-600"
                  : isSameDay(day, selectedDate)
                  ? "bg-blue-900/30 text-white"
                  : "bg-[#181825] text-gray-300 hover:bg-gray-800"
              } ${snapshot.isDraggingOver ? 'bg-gray-700/50' : ''}`}
              onClick={() => onDateClick(cloneDay)}
            >
              <div className="flex justify-between items-start">
                <span className={`font-semibold text-sm ${isSameDay(day, new Date()) ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                  {formattedDate}
                </span>
                {dayReminders.length > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                    {dayReminders.length}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-1 overflow-hidden h-[60px]">
                {dayReminders.slice(0, 3).map((rem, idx) => (
                  <div key={idx} className="text-[10px] truncate px-1 rounded-sm" style={{ backgroundColor: rem.reminderColor + '30', color: rem.reminderColor }}>
                    • {rem.title}
                  </div>
                ))}
                {dayReminders.length > 3 && (
                  <div className="text-[10px] text-gray-500 pl-1">+{dayReminders.length - 3} more</div>
                )}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e2e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="grid grid-cols-7 border-b border-gray-800 bg-[#11111b] text-gray-400 py-3">
        {weekdays.map(day => (
          <div key={day} className="text-center font-bold text-sm tracking-wider uppercase">{day}</div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {rows}
      </div>
    </div>
  );
};

export default CalendarGrid;
