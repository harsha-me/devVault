import React from 'react';
import { format } from 'date-fns';
import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import ReminderCard from './ReminderCard';

const ReminderList = ({ selectedDate, reminders, onAdd, onEdit, onDelete }) => {
  const dateStr        = format(selectedDate, 'yyyy-MM-dd');
  const todayReminders = reminders.filter(r => r.date === dateStr);

  return (
    <div className="reminder-list-container" style={{
      width: 300, minWidth: 300, display: 'flex', flexDirection: 'column',
      background: 'var(--cream)',
      border: '1px solid var(--stone-200)',
      borderRadius: 20,
      boxShadow: '0 2px 12px rgba(74,69,64,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.125rem', borderBottom: '1px solid var(--stone-200)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--stone-50)',
      }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--stone-900)', marginBottom: '0.125rem' }}>
            {format(selectedDate, 'MMMM d')}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', fontWeight: 500 }}>
            {format(selectedDate, 'EEEE')} · {todayReminders.length} reminder{todayReminders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onAdd}
          style={{
            width: 34, height: 34, borderRadius: 11,
            background: 'var(--accent)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(124,111,247,0.25)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Droppable list */}
      <Droppable droppableId={dateStr}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1, padding: '0.875rem', overflowY: 'auto',
              background: snapshot.isDraggingOver ? 'var(--lavender)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            {todayReminders.length === 0 ? (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--stone-300)', textAlign: 'center',
                padding: '2rem 1rem',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌿</div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--stone-400)' }}>No reminders</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--stone-300)', marginTop: '0.25rem' }}>A calm, clear day.</p>
                <button
                  onClick={onAdd}
                  style={{
                    marginTop: '1rem', background: 'none', border: 'none',
                    color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  + Add one
                </button>
              </div>
            ) : (
              todayReminders.map((rem, index) => (
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
