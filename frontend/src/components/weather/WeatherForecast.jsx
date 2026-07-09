import React from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Droplet } from 'lucide-react';

export const getWeatherIcon = (iconName, size = 18, color = 'var(--stone-600)') => {
  switch (iconName) {
    case 'night':
      return <Moon size={size} style={{ color: '#9B59B6' }} />;
    case 'cloudy':
      return <Cloud size={size} style={{ color: 'var(--stone-400)' }} />;
    case 'rainy':
      return <CloudRain size={size} style={{ color: '#3498DB' }} />;
    case 'stormy':
      return <CloudLightning size={size} style={{ color: '#E74C3C' }} />;
    case 'snowy':
      return <Snowflake size={size} style={{ color: '#95A5A6' }} />;
    case 'foggy':
      return <CloudFog size={size} style={{ color: '#BDC3C7' }} />;
    case 'sunny':
    default:
      return <Sun size={size} style={{ color: '#F1C40F' }} />;
  }
};

function WeatherForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div style={{ marginTop: '1.25rem', animation: 'dvFadeIn 0.5s ease both' }}>
      <h4 style={{
        fontSize: '0.75rem',
        fontWeight: 800,
        color: 'var(--stone-400)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.75rem',
        paddingLeft: '2px'
      }}>
        5-Day Forecast
      </h4>
      
      {/* Horizontal scrolling card container */}
      <div 
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
        className="forecast-scroll-container"
      >
        {forecast.map((day, idx) => (
          <div
            key={idx}
            style={{
              flex: '0 0 calc(33.33% - 6px)',
              minWidth: '95px',
              background: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid var(--stone-200)',
              borderRadius: '16px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}
            className="forecast-day-card"
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(74,69,64,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Day name (Shortened to 3 letters) */}
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--stone-900)' }}>
              {day.dayOfWeek ? day.dayOfWeek.substring(0, 3) : ''}
            </span>

            {/* Weather Icon */}
            <div style={{ margin: '2px 0' }}>
              {getWeatherIcon(day.conditionIcon, 22)}
            </div>

            {/* High/Low Temperature */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--stone-900)' }}>
                {Math.round(day.maxTempC)}°
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--stone-400)' }}>
                {Math.round(day.minTempC)}°
              </span>
            </div>

            {/* Chance of Rain */}
            {day.chanceOfRain > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#3498DB', fontSize: '0.62rem', fontWeight: 700 }}>
                <Droplet size={8} fill="#3498DB" />
                <span>{day.chanceOfRain}%</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.62rem', color: 'var(--stone-300)', fontWeight: 600 }}>
                Dry
              </div>
            )}

            {/* Description tooltip/label */}
            <span style={{
              fontSize: '0.58rem',
              color: 'var(--stone-400)',
              fontWeight: 600,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={day.description}>
              {day.conditionText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeatherForecast;
