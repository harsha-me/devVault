import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

/**
 * Fetch weather by city name
 * @param {string} city 
 * @returns {Promise<object>} Weather data
 */
export const getWeatherByCity = async (city) => {
  const response = await axios.get(`${API_BASE}/weather`, {
    params: { city }
  });
  return response.data;
};

/**
 * Fetch weather by geographic coordinates
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<object>} Weather data
 */
export const getWeatherByCoordinates = async (lat, lon) => {
  const response = await axios.get(`${API_BASE}/weather/current`, {
    params: { lat, lon }
  });
  return response.data;
};
