import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createReminder = async (reminderData) => {
  const response = await axios.post(`${API_BASE}/calendar/reminders`, reminderData, getAuthHeaders());
  return response.data;
};

export const getAllReminders = async () => {
  const response = await axios.get(`${API_BASE}/calendar/reminders`, getAuthHeaders());
  return response.data;
};

export const getDashboardReminders = async () => {
  const response = await axios.get(`${API_BASE}/calendar/reminders/dashboard`, getAuthHeaders());
  return response.data;
};

export const updateReminder = async (id, reminderData) => {
  const response = await axios.put(`${API_BASE}/calendar/reminders/${id}`, reminderData, getAuthHeaders());
  return response.data;
};

export const deleteReminder = async (id) => {
  const response = await axios.delete(`${API_BASE}/calendar/reminders/${id}`, getAuthHeaders());
  return response.data;
};
