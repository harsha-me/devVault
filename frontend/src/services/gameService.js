import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

export const gameService = {
  startGame: async (email) => {
    const response = await axios.post(`${API_BASE}/games/start`, { email });
    return response.data;
  },

  saveHistory: async (historyData) => {
    const response = await axios.post(`${API_BASE}/games/history`, historyData);
    return response.data;
  },

  getUserHistory: async (email) => {
    const response = await axios.get(`${API_BASE}/games/history/${email}`);
    return response.data;
  },

  deleteHistory: async (id) => {
    const response = await axios.delete(`${API_BASE}/games/history/${id}`);
    return response.data;
  },

  getStats: async (email) => {
    const response = await axios.get(`${API_BASE}/games/stats/${email}`);
    return response.data;
  }
};
