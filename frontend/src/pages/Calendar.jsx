import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import { DragDropContext } from '@hello-pangea/dnd';
import { Toaster, toast } from 'react-hot-toast';
import { Download, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import CalendarGrid from '../components/calendar/CalendarGrid';
import ReminderList from '../components/calendar/ReminderList';
import ReminderModal from '../components/calendar/ReminderModal';
import * as calendarService from '../services/calendarService';

function CalendarPage() {
  const token = localStorage.getItem("token");
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  useEffect(() => {
    if (token) {
      fetchReminders();
    }
  }, [token]);

  const fetchReminders = async () => {
    try {
      const data = await calendarService.getAllReminders();
      setReminders(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch reminders");
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const handleDateClick = (day) => {
    setSelectedDate(day);
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleSaveReminder = async (formData) => {
    try {
      if (editingReminder) {
        await calendarService.updateReminder(editingReminder.id, formData);
        toast.success("Reminder updated!");
      } else {
        await calendarService.createReminder(formData);
        toast.success("Reminder created!");
      }
      setIsModalOpen(false);
      fetchReminders();
      
      // Request notification permission if enabled
      if (formData.notificationEnabled && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    } catch (e) {
      toast.error("Failed to save reminder");
    }
  };

  const handleDeleteReminder = async (id) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await calendarService.deleteReminder(id);
        toast.success("Reminder deleted!");
        fetchReminders();
      } catch (e) {
        toast.error("Failed to delete reminder");
      }
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const reminderToMove = reminders.find(r => r.id.toString() === draggableId);
      if (reminderToMove) {
        const updatedReminder = { ...reminderToMove, date: destination.droppableId };
        
        // Optimistic update
        setReminders(prev => prev.map(r => r.id === reminderToMove.id ? updatedReminder : r));
        
        try {
          await calendarService.updateReminder(reminderToMove.id, updatedReminder);
          toast.success("Reminder moved!");
        } catch (e) {
          toast.error("Failed to move reminder");
          fetchReminders(); // Revert
        }
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("DevVault Reminders", 14, 15);
    
    const tableData = reminders.map(r => [
      r.date,
      r.time || 'N/A',
      r.title,
      r.priority,
      r.category
    ]);

    doc.autoTable({
      head: [['Date', 'Time', 'Title', 'Priority', 'Category']],
      body: tableData,
      startY: 25,
    });
    
    doc.save(`DevVault-Reminders-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Title', 'Description', 'Priority', 'Category'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + reminders.map(r => [
        r.date, 
        r.time || '', 
        `"${(r.title || '').replace(/"/g, '""')}"`, 
        `"${(r.description || '').replace(/"/g, '""')}"`, 
        r.priority, 
        r.category
      ].join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DevVault-Reminders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReminders = () => {
    window.print();
  };

  if (!token) return <Navigate to="/login" />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#11111b", color: "#cdd6f4", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Toaster position="bottom-right" />
      
      {/* Navbar */}
      <nav style={{ background: "rgba(17,17,27,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #313244", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💻</div>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(135deg,#cba6f7,#89b4fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevVault</span>
          </div>
          <Link to="/dashboard" style={{ color: "#a6adc8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>← Back to Dashboard</Link>
        </div>

        <div className="flex gap-3">
          <button onClick={exportToPDF} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-gray-800"><Download size={16} /> PDF</button>
          <button onClick={exportToCSV} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-gray-800"><Download size={16} /> CSV</button>
          <button onClick={printReminders} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm bg-[#1e1e2e] px-3 py-1.5 rounded-lg border border-gray-800"><Printer size={16} /> Print</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex p-6 gap-6 h-[calc(100vh-60px)] overflow-hidden">
        
        {/* Calendar Section */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-100">{format(currentDate, 'MMMM yyyy')}</h1>
            <div className="flex gap-2 bg-[#1e1e2e] rounded-lg p-1 border border-gray-800">
              <button onClick={handlePrevMonth} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 text-sm font-semibold text-gray-300 hover:text-white">Today</button>
              <button onClick={handleNextMonth} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-1 gap-6 min-h-0">
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
            </div>
          </DragDropContext>
        </div>
      </div>

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
