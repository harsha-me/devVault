import React from 'react';
import { Wind, Droplets, Sunrise, Sunset, Thermometer, Gauge, Eye, Sun } from 'lucide-react';

function WeatherDetails({ weather }) {
  if (!weather) return null;

  const details = [
    {
      label: 'Feels Like',
      value: `${Math.round(weather.feelsLikeC)}°C`,
      icon: Thermometer,
      color: '#E8745A',
      bg: 'var(--peach)'
    },
    {
      label: 'Humidity',
      value: `${weather.humidity}%`,
      icon: Droplets,
      color: '#3498DB',
      bg: 'var(--pale-blue)'
    },
    {
      label: 'Wind Speed',
      value: `${weather.windSpeedKph} km/h`,
      icon: Wind,
      color: '#7F8C8D',
      bg: 'var(--stone-100)'
    },
    {
      label: 'UV Index',
      value: weather.uvIndex !== undefined ? weather.uvIndex : 'N/A',
      icon: Sun,
      color: '#F1C40F',
      bg: '#FEF9E7'
    },
    {
      label: 'Air Pressure',
      value: `${weather.pressureMb} hPa`,
      icon: Gauge,
      color: '#9B59B6',
      bg: '#F5EEF8'
    },
    {
      label: 'Visibility',
      value: `${weather.visibilityKm} km`,
      icon: Eye,
      color: '#16A085',
      bg: 'var(--success-light)'
    },
    {
      label: 'Sunrise',
      value: weather.sunrise || '--:--',
      icon: Sunrise,
      color: '#E67E22',
      bg: '#FBEEE6'
    },
    {
      label: 'Sunset',
      value: weather.sunset || '--:--',
      icon: Sunset,
      color: '#2C3E50',
      bg: '#EAECEE'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.75rem',
      marginTop: '1.25rem',
      animation: 'dvFadeIn 0.5s ease both'
    }}>
      {details.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.85rem',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid var(--stone-200)',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            className="weather-detail-pill"
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: item.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color
            }}>
              <IconComponent size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--stone-400)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--stone-900)' }}>
                {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WeatherDetails;
