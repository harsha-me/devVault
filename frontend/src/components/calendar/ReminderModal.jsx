import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#7C6FF7', '#5C8A6A', '#D97706', '#2E6BAA', '#C0392B', '#8E44AD', '#2980B9'];

const ReminderModal = ({ isOpen, onClose, onSave, selectedDate, existingReminder }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '',
    priority: 'Medium', category: 'Personal',
    repeatType: 'None', reminderColor: '#7C6FF7',
    notificationEnabled: false, notificationTime: '15 min',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(existingReminder ? { ...existingReminder } : {
        title: '', description: '',
        date: format(selectedDate, 'yyyy-MM-dd'), time: '',
        priority: 'Medium', category: 'Personal',
        repeatType: 'None', reminderColor: '#7C6FF7',
        notificationEnabled: false, notificationTime: '15 min',
      });
    }
  }, [isOpen, selectedDate, existingReminder]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--stone-700)', marginBottom: '0.375rem' }}>
      {children}
    </label>
  );

  return (
    <div
      className="dv-overlay"
      onClick={onClose}
    >
      <div
        className="dv-modal"
        style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--stone-200)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--stone-50)', borderRadius: '24px 24px 0 0',
        }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--stone-900)' }}>
              {existingReminder ? '✏️ Edit Reminder' : '🌿 New Reminder'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--stone-400)', marginTop: '0.125rem' }}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--stone-100)', border: '1px solid var(--stone-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--stone-400)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--stone-100)'; e.currentTarget.style.color = 'var(--stone-400)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <Label>Title *</Label>
            <input required type="text" name="title" maxLength={100} value={formData.title} onChange={handleChange} className="dv-input" placeholder="e.g. Team Standup" />
          </div>

          <div>
            <Label>Description</Label>
            <textarea name="description" maxLength={1000} value={formData.description} onChange={handleChange} placeholder="Optional notes…" style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: '1.5px solid var(--stone-200)', background: 'var(--cream)',
              color: 'var(--stone-900)', fontFamily: 'inherit', fontSize: '0.9375rem',
              outline: 'none', resize: 'vertical', minHeight: 80, lineHeight: 1.6,
              transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 4px rgba(124,111,247,0.1)'; }}
            onBlur={e => { e.target.style.borderColor='var(--stone-200)'; e.target.style.boxShadow='none'; }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label>Date *</Label>
              <input required type="date" name="date" min={format(new Date(), 'yyyy-MM-dd')} value={formData.date} onChange={handleChange} className="dv-input" style={{ paddingTop: 11, paddingBottom: 11 }} />
            </div>
            <div>
              <Label>Time</Label>
              <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className="dv-input" style={{ paddingTop: 11, paddingBottom: 11 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label>Category</Label>
              <select name="category" value={formData.category} onChange={handleChange} className="dv-select">
                {['Personal','Study','Work','Health','Custom'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="dv-select">
                {['Low','Medium','High'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Color picker */}
            <div>
              <Label>Color</Label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {COLORS.map(c => (
                  <button
                    key={c} type="button" onClick={() => setFormData(p => ({...p, reminderColor: c}))}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c, border: 'none',
                      cursor: 'pointer',
                      outline: formData.reminderColor === c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset: 2,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
                {/* Custom color input */}
                <label style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--stone-200)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} title="Custom color">
                  <input type="color" name="reminderColor" value={formData.reminderColor} onChange={handleChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 12, color: 'var(--stone-400)' }}>+</span>
                </label>
              </div>
            </div>
            <div>
              <Label>Repeat</Label>
              <select name="repeatType" value={formData.repeatType} onChange={handleChange} className="dv-select">
                {['None','Daily','Weekly','Monthly'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Notification toggle */}
          <div style={{ background: 'var(--stone-100)', borderRadius: 12, padding: '0.875rem 1rem', border: '1px solid var(--stone-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input type="checkbox" name="notificationEnabled" checked={formData.notificationEnabled} onChange={handleChange} style={{ display: 'none' }} />
                <div onClick={() => setFormData(p => ({...p, notificationEnabled: !p.notificationEnabled}))} style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: formData.notificationEnabled ? 'var(--accent)' : 'var(--stone-300)',
                  cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 3,
                    left: formData.notificationEnabled ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--stone-700)' }}>Enable Notification</span>
            </label>
            {formData.notificationEnabled && (
              <select name="notificationTime" value={formData.notificationTime} onChange={handleChange} className="dv-select" style={{ width: 'auto', padding: '6px 30px 6px 10px', fontSize: '0.8rem' }}>
                {['5 min','15 min','30 min','1 hour'].map(t => <option key={t} value={t}>{t} before</option>)}
              </select>
            )}
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--stone-200)', display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', background: 'var(--stone-50)', borderRadius: '0 0 24px 24px' }}>
          <button type="button" onClick={onClose} className="dv-btn dv-btn-ghost" style={{ padding: '9px 20px', borderRadius: 12 }}>Cancel</button>
          <button onClick={handleSubmit} className="dv-btn dv-btn-accent" style={{ padding: '9px 22px', borderRadius: 12 }}>
            {existingReminder ? '✓ Save Changes' : '+ Create Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
