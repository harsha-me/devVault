import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

const getEmail = () => localStorage.getItem('email');

export const createReminder = async (reminderData) => {
  const email = getEmail();
  const response = await axios.post(`${API_BASE}/calendar/reminders/${email}`, reminderData);
  return response.data;
};

export const getAllReminders = async () => {
  const email = getEmail();
  const response = await axios.get(`${API_BASE}/calendar/reminders/${email}`);
  return response.data;
};

export const getDashboardReminders = async () => {
  const email = getEmail();
  const response = await axios.get(`${API_BASE}/calendar/reminders/dashboard/${email}`);
  return response.data;
};

export const updateReminder = async (id, reminderData) => {
  const response = await axios.put(`${API_BASE}/calendar/reminders/update/${id}`, reminderData);
  return response.data;
};

export const deleteReminder = async (id) => {
  const response = await axios.delete(`${API_BASE}/calendar/reminders/delete/${id}`);
  return response.data;
};
