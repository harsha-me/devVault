import React from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { Droppable } from '@hello-pangea/dnd';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid = ({ currentDate, selectedDate, onDateClick, reminders }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(monthStart);
  const startDate  = startOfWeek(monthStart);
  const endDate    = endOfWeek(monthEnd);

  const rows = [];
  let days = [];
  let day  = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay    = day;
      const dateStr     = format(cloneDay, 'yyyy-MM-dd');
      const dayLabel    = format(cloneDay, 'd');
      const dayReminders = reminders.filter(r => r.date === dateStr);
      const isToday      = isSameDay(cloneDay, new Date());
      const isSelected   = isSameDay(cloneDay, selectedDate);
      const inMonth      = isSameMonth(cloneDay, monthStart);

      days.push(
        <Droppable droppableId={dateStr} key={cloneDay.toString()}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              onClick={() => onDateClick(cloneDay)}
              style={{
                minHeight: 96,
                padding: '0.5rem 0.625rem',
                borderRight: '1px solid var(--stone-200)',
                borderBottom: '1px solid var(--stone-200)',
                background: snapshot.isDraggingOver
                  ? 'var(--lavender)'
                  : !inMonth
                  ? 'var(--stone-50)'
                  : isSelected
                  ? 'rgba(230,225,216,0.6)'
                  : 'var(--cream)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isSelected && inMonth) e.currentTarget.style.background = 'var(--stone-100)'; }}
              onMouseLeave={e => {
                if (!isSelected && inMonth) e.currentTarget.style.background = snapshot.isDraggingOver ? 'var(--lavender)' : 'var(--cream)';
              }}
            >
              {/* Day number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                <span style={{
                  fontSize: '0.8125rem', fontWeight: isToday ? 700 : 600,
                  color: !inMonth ? 'var(--stone-300)'
                    : isToday    ? '#fff'
                    : isSelected ? 'var(--accent)'
                    : 'var(--stone-600)',
                  width: isToday ? 24 : 'auto', height: isToday ? 24 : 'auto',
                  borderRadius: isToday ? '50%' : 0,
                  background: isToday ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                  flexShrink: 0,
                }}>
                  {dayLabel}
                </span>
                {dayReminders.length > 0 && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    padding: '1px 6px', borderRadius: 6,
                  }}>
                    {dayReminders.length}
                  </span>
                )}
              </div>

              {/* Reminder dots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', maxHeight: 52 }}>
                {dayReminders.slice(0, 3).map((rem, idx) => (
                  <div key={idx} style={{
                    fontSize: '0.65rem', padding: '2px 5px', borderRadius: 5,
                    fontWeight: 600,
                    background: rem.reminderColor + '22',
                    color: rem.reminderColor,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    · {rem.title}
                  </div>
                ))}
                {dayReminders.length > 3 && (
                  <div style={{ fontSize: '0.6rem', color: 'var(--stone-400)', paddingLeft: 4 }}>
                    +{dayReminders.length - 3} more
                  </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }} key={day}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--ivory)',
      border: '1px solid var(--stone-200)',
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(74,69,64,0.06)',
    }}>
      {/* Weekday headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
        borderBottom: '1px solid var(--stone-200)',
        background: 'var(--stone-50)',
      }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', padding: '0.625rem 0',
            fontSize: '0.7rem', fontWeight: 700,
            color: 'var(--stone-400)', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {rows}
      </div>
    </div>
  );
};

export default CalendarGrid;
