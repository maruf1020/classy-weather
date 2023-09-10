import React from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
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

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { location: 'dhaka', loading: false, displayCity: "", weather: {} };
    this.fetchWeather = this.fetchWeather.bind(this)
  }


  async fetchWeather() {
    const { location } = this.state;
    try {
      this.setState({ loading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({ displayCity: `${name} ${convertToFlag(country_code)}` });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily })
    } catch (err) {
      console.err(err);
    } finally {
      this.setState({ loading: false });
    }
  }


  render() {
    const { location, loading, displayCity, weather } = this.state;
    return (
      <div className='app'>
        <h1>Classy Weather</h1>
        <div>
          <input type='text' placeholder='Enter a city name' value={location}
            onChange={e => this.setState({ location: e.target.value })} />
        </div>
        <button onClick={this.fetchWeather}>Get Weather</button>

        {loading && <p className="loading">Loading...</p>}
        {!loading && weather.weathercode && <Weather weather={weather} displayCity={displayCity} />}
      </div>
    )
  }
}
export default App;


class Weather extends React.Component {
  render() {
    const { displayCity, weather: { temperature_2m_max: maxTemp, temperature_2m_min: minTemp, time: dates, weathercode: codes } } = this.props;

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
}

class Day extends React.Component {
  render() {
    const { date, maxTemp, minTemp, code, isToday } = this.props;
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
}