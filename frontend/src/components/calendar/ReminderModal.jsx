import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

const ReminderModal = ({ isOpen, onClose, onSave, selectedDate, existingReminder }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    priority: 'Medium',
    category: 'Personal',
    repeatType: 'None',
    reminderColor: '#89b4fa',
    notificationEnabled: false,
    notificationTime: '15 min'
  });

  useEffect(() => {
    if (isOpen) {
      if (existingReminder) {
        setFormData({ ...existingReminder });
      } else {
        setFormData({
          title: '',
          description: '',
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: '',
          priority: 'Medium',
          category: 'Personal',
          repeatType: 'None',
          reminderColor: '#89b4fa',
          notificationEnabled: false,
          notificationTime: '15 min'
        });
      }
    }
  }, [isOpen, selectedDate, existingReminder]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e2e] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100">{existingReminder ? 'Edit Reminder' : 'New Reminder'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500" placeholder="E.g., Team Meeting" />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500 h-24" placeholder="Optional notes..."></textarea>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Time</label>
              <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500">
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Work">Work</option>
                <option value="Health">Health</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Color</label>
              <input type="color" name="reminderColor" value={formData.reminderColor} onChange={handleChange} className="w-full h-11 bg-[#11111b] border border-gray-800 rounded-lg p-1 cursor-pointer" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Repeat</label>
              <select name="repeatType" value={formData.repeatType} onChange={handleChange} className="w-full bg-[#11111b] border border-gray-800 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500">
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-800 rounded-lg p-3 bg-[#11111b] flex items-center justify-between mt-2">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="notificationEnabled" checked={formData.notificationEnabled} onChange={handleChange} className="w-4 h-4 rounded bg-gray-900 border-gray-700" />
                <span className="text-gray-200">Enable Notification</span>
              </label>
            </div>
            {formData.notificationEnabled && (
              <select name="notificationTime" value={formData.notificationTime} onChange={handleChange} className="bg-[#1e1e2e] border border-gray-800 rounded px-2 py-1 text-sm text-gray-200">
                <option value="5 min">5 min before</option>
                <option value="15 min">15 min before</option>
                <option value="30 min">30 min before</option>
                <option value="1 hour">1 hour before</option>
              </select>
            )}
          </div>
          
          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-[#cba6f7] to-[#89b4fa] text-[#11111b] font-bold rounded-lg hover:opacity-90 transition-opacity">Save Reminder</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
