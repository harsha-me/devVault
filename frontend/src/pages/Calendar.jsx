import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import { DragDropContext } from '@hello-pangea/dnd';
import { Toaster, toast } from 'react-hot-toast';
import { Download, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import CalendarGrid   from '../components/calendar/CalendarGrid';
import ReminderList   from '../components/calendar/ReminderList';
import ReminderModal  from '../components/calendar/ReminderModal';
import * as calendarService from '../services/calendarService';
import Sidebar from '../components/Sidebar';

function CalendarPage() {
  const token = localStorage.getItem('token');

  const [currentDate,    setCurrentDate]    = useState(new Date());
  const [selectedDate,   setSelectedDate]   = useState(new Date());
  const [reminders,      setReminders]      = useState([]);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editingReminder,setEditingReminder]= useState(null);

  useEffect(() => { if (token) fetchReminders(); }, [token]);

  const fetchReminders = async () => {
    try { setReminders(await calendarService.getAllReminders()); }
    catch (e) { console.error(e); toast.error('Failed to fetch reminders'); }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleDateClick = (day) => setSelectedDate(day);

  const openAddModal  = () => { setEditingReminder(null); setIsModalOpen(true); };
  const openEditModal = (r) => { setEditingReminder(r);   setIsModalOpen(true); };

  const handleSaveReminder = async (formData) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (formData.date < todayStr)  { toast.error('Cannot set reminders to past dates!');  return; }
    if (formData.date === todayStr && formData.time) {
      if (formData.time < format(new Date(), 'HH:mm')) { toast.error('Cannot set reminders to a past time today!'); return; }
    }
    if (!formData.title.trim()) { toast.error('Title cannot be empty!'); return; }
    try {
      if (editingReminder) { await calendarService.updateReminder(editingReminder.id, formData); toast.success('Reminder updated! ✓'); }
      else                 { await calendarService.createReminder(formData);                      toast.success('Reminder created! ✓'); }
      setIsModalOpen(false); fetchReminders();
      if (formData.notificationEnabled && Notification.permission !== 'granted') Notification.requestPermission();
    } catch { toast.error('Failed to save reminder'); }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try { await calendarService.deleteReminder(id); toast.success('Reminder deleted'); fetchReminders(); }
    catch { toast.error('Failed to delete reminder'); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (destination.droppableId < todayStr) { toast.error('Cannot move reminders to past dates!'); return; }
      const rem = reminders.find(r => r.id.toString() === draggableId);
      if (rem) {
        const updated = { ...rem, date: destination.droppableId };
        setReminders(prev => prev.map(r => r.id === rem.id ? updated : r));
        try { await calendarService.updateReminder(rem.id, updated); toast.success('Reminder moved!'); }
        catch { toast.error('Failed to move reminder'); fetchReminders(); }
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('DevVault Reminders', 14, 15);
    doc.autoTable({ head: [['Date','Time','Title','Priority','Category']], body: reminders.map(r=>[r.date,r.time||'N/A',r.title,r.priority,r.category]), startY: 25 });
    doc.save(`DevVault-Reminders-${format(new Date(),'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Date','Time','Title','Description','Priority','Category'];
    const csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n'
      + reminders.map(r=>[r.date,r.time||'',`"${(r.title||'').replace(/"/g,'""')}"`,`"${(r.description||'').replace(/"/g,'""')}"`,r.priority,r.category].join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `DevVault-Reminders-${format(new Date(),'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="dv-page">
      <Sidebar />
      <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'var(--cream)', color: 'var(--stone-900)', border: '1px solid var(--stone-200)', borderRadius: 14, boxShadow: '0 8px 24px rgba(74,69,64,0.12)' } }} />

      <main className="dv-main" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div className="dv-sticky-topbar" style={{
          minHeight: 60, height: 'auto', background: 'var(--cream)',
          borderBottom: '1px solid var(--stone-200)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 1.25rem',
          flexShrink: 0,
          flexWrap: 'wrap', gap: '8px'
        }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.02em' }}>
              {format(currentDate, 'MMMM yyyy')}
            </h1>
            <div style={{ display: 'flex', background: 'var(--stone-100)', borderRadius: 11, padding: 3, gap: 2, border: '1px solid var(--stone-200)' }}>
              <button onClick={handlePrevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--stone-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--stone-200)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              ><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentDate(new Date())} style={{ padding: '0 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--stone-700)', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--stone-200)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >Today</button>
              <button onClick={handleNextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--stone-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--stone-200)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              ><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { label: 'PDF', icon: <Download size={13} />, action: exportToPDF },
              { label: 'CSV', icon: <Download size={13} />, action: exportToCSV },
              { label: 'Print', icon: <Printer size={13} />, action: () => window.print() },
            ].map(({ label, icon, action }) => (
              <button key={label} onClick={action} className="dv-btn dv-btn-ghost" style={{ padding: '7px 14px', borderRadius: 10, fontSize: '0.8rem', gap: 5 }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Calendar body ── */}
        <div className="calendar-body-container" style={{ flex: 1, display: 'flex', padding: '1.25rem 1.75rem', gap: '1.25rem', overflow: 'hidden', minHeight: 0 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <CalendarGrid
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              reminders={reminders}
            />
            <ReminderList
              selectedDate={selectedDate}
              reminders={reminders}
              onAdd={openAddModal}
              onEdit={openEditModal}
              onDelete={handleDeleteReminder}
            />
          </DragDropContext>
        </div>
      </main>

      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReminder}
        selectedDate={selectedDate}
        existingReminder={editingReminder}
      />
    </div>
  );
}

export default CalendarPage;
