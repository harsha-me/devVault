import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Edit2, Trash2, Clock, Bell } from 'lucide-react';

const PRIORITY_STYLES = {
  High:   { background: 'rgba(192,57,43,0.1)', color: '#C0392B' },
  Medium: { background: 'rgba(217,119,6,0.12)', color: '#A85E00' },
  Low:    { background: 'rgba(46,125,82,0.1)',  color: '#2E7D52' },
};

const ReminderCard = ({ reminder, index, onEdit, onDelete }) => {
  const priorityStyle = PRIORITY_STYLES[reminder.priority] || PRIORITY_STYLES.Medium;

  return (
    <Draggable draggableId={reminder.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            marginBottom: '0.625rem',
            borderRadius: 14,
            border: `1px solid ${snapshot.isDragging ? 'var(--accent)' : 'var(--stone-200)'}`,
            background: snapshot.isDragging ? 'var(--lavender)' : 'var(--ivory)',
            boxShadow: snapshot.isDragging
              ? '0 12px 32px rgba(124,111,247,0.2)'
              : '0 1px 4px rgba(74,69,64,0.05)',
            padding: '0.875rem 1rem',
            transform: snapshot.isDragging
              ? (provided.draggableProps.style?.transform || '') + ' scale(1.02)'
              : provided.draggableProps.style?.transform,
            transition: snapshot.isDragging ? 'box-shadow 0.2s, border-color 0.2s' : 'all 0.18s ease',
            cursor: 'grab',
            position: 'relative',
          }}
        >
          {/* Color accent stripe */}
          <div style={{
            position: 'absolute', left: 0, top: 10, bottom: 10,
            width: 3, borderRadius: '0 4px 4px 0',
            background: reminder.reminderColor,
          }} />

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem', marginBottom: '0.375rem' }}>
            <h4 style={{
              fontSize: '0.875rem', fontWeight: 700,
              color: 'var(--stone-900)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, paddingRight: '0.5rem',
            }}>
              {reminder.title}
            </h4>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, opacity: 0 }}
              className="reminder-actions"
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <button
                onClick={e => { e.stopPropagation(); onEdit(reminder); }}
                style={{ background: 'var(--stone-100)', border: '1px solid var(--stone-200)', borderRadius: 7, padding: '4px 6px', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--stone-100)'}
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(reminder.id); }}
                style={{ background: 'var(--stone-100)', border: '1px solid var(--stone-200)', borderRadius: 7, padding: '4px 6px', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--stone-100)'}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Description */}
          {reminder.description && (
            <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', paddingLeft: '0.5rem', marginBottom: '0.5rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {reminder.description}
            </p>
          )}

          {/* Metadata pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: '0.5rem' }}>
            {reminder.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, background: 'var(--stone-100)', color: 'var(--stone-600)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--stone-200)' }}>
                <Clock size={10} /> {reminder.time}
              </span>
            )}
            <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--stone-100)', color: 'var(--stone-600)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--stone-200)' }}>
              {reminder.category}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, ...priorityStyle }}>
              {reminder.priority}
            </span>
            {reminder.notificationEnabled && (
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem', background: 'var(--pale-blue)', color: '#2E6BAA', padding: '3px 8px', borderRadius: 6, border: '1px solid #C4DCF8', gap: 4, fontWeight: 600 }}
                title={`Notifies ${reminder.notificationTime} before`}>
                <Bell size={10} /> {reminder.notificationTime}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ReminderCard;
