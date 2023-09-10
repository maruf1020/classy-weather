import React, { useEffect } from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤️"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "💨"],
    [[51, 56, 61, 66, 80], "🌦️"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧️"],
    [[71, 73, 75, 77, 85, 86], "🌧️"],
    [[95], "🌩️"],
    [[96, 99], "⛈️"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

export default function App() {
  const [location, setLocation] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [displayCity, setDisplayCity] = React.useState('');
  const [weather, setWeather] = React.useState({});
  const [error, setError] = React.useState(null);

  const fetchWeather = async () => {
    if (location.length < 2) {
      setWeather({});
      setDisplayCity('');
      return;
    }

    try {
      setLoading(true);

      //geolocation - city name to coordinates and other data
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      setDisplayCity(`${name} ${convertToFlag(country_code)}`);

      // Get weather data by coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  //we can imagine this as useEffect with empty array
  useEffect(() => {
    // this.fetchWeather();
    setLocation(localStorage.getItem('location') || '');
  }, []);

  //we can imagine this as useEffect with dependency array
  useEffect(() => {
    if (location) {
      fetchWeather();
      localStorage.setItem('location', location);
    }
  }, [location]);

  if (error) {
    console.error(error);
  }

  return (
    <div className='app'>
      <h1>Classy Weather</h1>
      <div>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={'Enter a city name'} />
      </div>
      {loading && <p className="loading">Loading...</p>}
      {!loading && weather.weathercode && <Weather weather={weather} displayCity={displayCity} />}
    </div>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      placeholder={placeholder}
      type='text'
      value={value}
      onChange={onChange}
    />
  )
}

function Weather({ weather: { temperature_2m_max: maxTemp, temperature_2m_min: minTemp, time: dates, weathercode: codes }, displayCity }) {
  return (
    <div>
      <h2>weather {displayCity}</h2>
      <ul className='weather'>
        {dates.map((date, i) => (
          <Day
            key={date}
            date={date}
            maxTemp={maxTemp.at(i)}
            minTemp={minTemp.at(i)}
            code={codes.at(i)}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  )
}

function Day({ date, maxTemp, minTemp, code, isToday }) {
  return (
    <li className='day'>
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(minTemp)}&deg; &mdash; <strong>{Math.ceil(maxTemp)}&deg;</strong>
      </p>
    </li>
  )
}
