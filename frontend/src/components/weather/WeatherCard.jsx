import React, { useState, useEffect } from 'react';
import { Search, Navigation, RefreshCw, X, AlertCircle } from 'lucide-react';
import * as weatherService from '../../services/weatherService';
import WeatherDetails from './WeatherDetails';
import WeatherForecast, { getWeatherIcon } from './WeatherForecast';

// Recommended/popular developer cities for quick select autocomplete suggestions
const SUGGESTED_CITIES = ['Seattle', 'London', 'San Francisco', 'Tokyo', 'Berlin'];

function WeatherCard({ onWeatherChange }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('devvault_recent_weather_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent searches', e);
      }
    }

    // Try to load initial weather
    loadInitialWeather();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update background when weather updates
  useEffect(() => {
    if (weather && onWeatherChange) {
      onWeatherChange(weather);
    }
  }, [weather, onWeatherChange]);

  const loadInitialWeather = () => {
    // Check if we have permission already cached, or ask for it
    const lastCity = localStorage.getItem('devvault_last_weather_city');
    
    if (navigator.geolocation && localStorage.getItem('devvault_geo_permission') === 'granted') {
      fetchWeatherByGeo();
    } else if (lastCity) {
      fetchWeather(lastCity);
    } else {
      // Fallback default city (e.g. London)
      fetchWeather('London');
    }
  };

  const fetchWeather = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await weatherService.getWeatherByCity(city);
      setWeather(data);
      localStorage.setItem('devvault_last_weather_city', data.city);
      addToRecentSearches(data.city);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
      setError('Weather service is currently offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByGeo = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        localStorage.setItem('devvault_geo_permission', 'granted');
        const { latitude, longitude } = position.coords;
        try {
          const data = await weatherService.getWeatherByCoordinates(latitude, longitude);
          setWeather(data);
          if (data.city) {
            localStorage.setItem('devvault_last_weather_city', data.city);
            addToRecentSearches(data.city);
          }
          setLastRefreshed(new Date());
        } catch (e) {
          console.error(e);
          setError('Failed to fetch local weather. Trying default city.');
          // Fallback to London
          fetchWeather(localStorage.getItem('devvault_last_weather_city') || 'London');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        localStorage.setItem('devvault_geo_permission', 'denied');
        console.warn('Geolocation permission denied:', geoError);
        // Fallback to last searched city or default
        const lastCity = localStorage.getItem('devvault_last_weather_city') || 'London';
        fetchWeather(lastCity);
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery.trim());
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const addToRecentSearches = (city) => {
    if (!city) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== city.toLowerCase());
      const updated = [city, ...filtered].slice(0, 3); // Keep last 3 searches
      localStorage.setItem('devvault_recent_weather_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (e, cityToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(c => c !== cityToRemove);
      localStorage.setItem('devvault_recent_weather_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Determine soft card gradient based on weather condition
  const getCardGradient = () => {
    if (!weather) return 'linear-gradient(135deg, var(--stone-50) 0%, var(--stone-100) 100%)';
    const condition = weather.conditionIcon;
    switch (condition) {
      case 'sunny':
        return 'linear-gradient(135deg, #FFFDF5 0%, #FFF5D8 100%)';
      case 'night':
        return 'linear-gradient(135deg, #F8F7FF 0%, #EBE5FF 100%)';
      case 'cloudy':
        return 'linear-gradient(135deg, #F8F7F4 0%, #ECE9DF 100%)';
      case 'rainy':
        return 'linear-gradient(135deg, #F1F6FB 0%, #D7E7F8 100%)';
      case 'stormy':
        return 'linear-gradient(135deg, #ECE9F2 0%, #DCD2EB 100%)';
      case 'snowy':
        return 'linear-gradient(135deg, #F4F8FD 0%, #DFECF9 100%)';
      case 'foggy':
        return 'linear-gradient(135deg, #F3F5F2 0%, #DFE5DF 100%)';
      default:
        return 'linear-gradient(135deg, var(--cream) 0%, var(--stone-100) 100%)';
    }
  };

  // Get matching accent color for the weather theme
  const getThemeAccentColor = () => {
    if (!weather) return 'var(--accent)';
    const condition = weather.conditionIcon;
    switch (condition) {
      case 'rainy':
        return '#3498DB';
      case 'stormy':
        return '#8E44AD';
      case 'snowy':
        return '#5DADE2';
      case 'sunny':
        return '#F39C12';
      case 'night':
        return '#7C6FF7';
      default:
        return 'var(--accent)';
    }
  };

  const accentColor = getThemeAccentColor();

  if (loading && !weather) {
    return (
      <div className="dv-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '380px' }}>
        {/* Loading skeleton shimmer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="animate-pulse" style={{ height: '24px', width: '120px', background: 'var(--stone-200)', borderRadius: '6px' }} />
          <div className="animate-pulse" style={{ height: '28px', width: '28px', background: 'var(--stone-200)', borderRadius: '50%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
          <div className="animate-pulse" style={{ height: '48px', width: '48px', background: 'var(--stone-200)', borderRadius: '50%' }} />
          <div className="animate-pulse" style={{ height: '36px', width: '80px', background: 'var(--stone-200)', borderRadius: '6px' }} />
          <div className="animate-pulse" style={{ height: '18px', width: '100px', background: 'var(--stone-200)', borderRadius: '6px' }} />
        </div>
        <div className="animate-pulse" style={{ height: '60px', width: '100%', background: 'var(--stone-200)', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div
      className="dv-card dv-card-hover dv-fade-up"
      style={{
        padding: '1.5rem',
        background: getCardGradient(),
        borderColor: 'var(--stone-200)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        overflow: 'visible',
        transition: 'all 0.4s ease'
      }}
    >
      {/* Header controls: Search & Geolocation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '1rem', color: accentColor }}>🌤️</span>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--stone-900)' }}>
            Weather Dashboard
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={fetchWeatherByGeo}
            title="Use current location"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid var(--stone-200)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--stone-600)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'}
          >
            <Navigation size={13} />
          </button>
          <button
            onClick={() => weather ? fetchWeather(weather.city) : loadInitialWeather()}
            title="Refresh weather"
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid var(--stone-200)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--stone-600)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Input and suggestions */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', zIndex: 5 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--stone-400)' }} />
          <input
            type="text"
            placeholder="Search city..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '10px',
              border: '1px solid var(--stone-200)',
              background: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.8125rem',
              color: 'var(--stone-900)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            className="weather-search-input"
          />
        </div>

        {/* Suggestion Dropdown */}
        {showSuggestions && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--cream)',
            border: '1px solid var(--stone-200)',
            borderRadius: '12px',
            marginTop: '4px',
            boxShadow: '0 4px 16px rgba(74,69,64,0.1)',
            zIndex: 10,
            overflow: 'hidden'
          }}>
            {/* Suggested Popular Cities */}
            <div style={{ padding: '6px 10px 4px 10px', fontSize: '0.625rem', fontWeight: 800, color: 'var(--stone-400)', textTransform: 'uppercase' }}>
              Suggested
            </div>
            {SUGGESTED_CITIES.map(city => (
              <button
                key={city}
                type="button"
                onMouseDown={() => fetchWeather(city)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 12px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--stone-700)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--stone-100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                📍 {city}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Recent Searches Pills */}
      {recentSearches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--stone-400)', marginRight: '2px' }}>
            Recents:
          </span>
          {recentSearches.map(city => (
            <div
              key={city}
              onClick={() => fetchWeather(city)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(255, 255, 255, 0.4)',
                border: '1px solid var(--stone-200)',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--stone-600)',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
            >
              <span>{city}</span>
              <button
                type="button"
                onClick={(e) => removeRecentSearch(e, city)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--stone-400)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Friendly error message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--danger-light)',
          border: '1px solid #FDDCC4',
          borderRadius: '10px',
          color: 'var(--danger)',
          fontSize: '0.75rem',
          fontWeight: 600,
          animation: 'dvFadeIn 0.3s ease'
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Weather Information Display */}
      {weather && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Temperature & City Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.25rem 0' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                {/* Temperature counter animation class could go here, we rounded it */}
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--stone-900)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {Math.round(weather.tempC)}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: accentColor }}>°C</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--stone-900)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                📍 {weather.city}
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--stone-400)' }}>
                  {weather.country}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="weather-icon-pulse" style={{ animation: 'dvPulse 3s infinite ease-in-out' }}>
                {getWeatherIcon(weather.conditionIcon, 48)}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--stone-500)', marginTop: '4px', textAlign: 'center' }}>
                {weather.conditionText}
              </span>
            </div>
          </div>

          {/* Smart Developer Insight Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            borderLeft: `3px solid ${accentColor}`,
            padding: '10px 12px',
            borderRadius: '0 12px 12px 0',
            marginTop: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              💡 Developer Insight
            </span>
            <p style={{ fontSize: '0.78rem', color: 'var(--stone-700)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              {weather.developerInsight}
            </p>
          </div>

          {/* Premium Enhancement: Quote & Best coding time */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '0 4px',
            marginTop: '0.2rem'
          }}>
            {weather.codingQuote && (
              <span style={{ fontSize: '0.7rem', color: 'var(--stone-500)', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.3 }}>
                "{weather.codingQuote}"
              </span>
            )}
            {weather.bestCodingTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--stone-600)', marginTop: '2px' }}>
                ⏰ <span style={{ color: 'var(--stone-400)' }}>Best coding focus:</span> <span style={{ color: accentColor }}>{weather.bestCodingTime.split('(')[0].trim()}</span>
              </div>
            )}
          </div>

          {/* 5-Day Forecast */}
          <WeatherForecast forecast={weather.forecast} />

          {/* Weather Details (UV, wind, humidity, etc.) */}
          <WeatherDetails weather={weather} />

          {/* Last Updated Timestamp */}
          <div style={{
            fontSize: '0.6rem',
            color: 'var(--stone-400)',
            textAlign: 'right',
            marginTop: '0.5rem',
            fontWeight: 500
          }}>
            Last synced: {weather.lastUpdated || (lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Just now')}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherCard;
