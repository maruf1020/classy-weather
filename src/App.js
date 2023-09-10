import React from 'react';

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

class App extends React.Component {

  state = {
    location: '',
    loading: false,
    displayCity: "",
    weather: {}
  };

  fetchWeather = async () => {
    const { location } = this.state;

    if (location.length < 2) {
      this.setState({ weather: {} })
      this.setState({ displayCity: "" })
      return;
    }
    try {
      this.setState({ loading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );
      const geoData = await geoRes.json();

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
      console.error(err);
    } finally {
      this.setState({ loading: false });
    }
  }

  //we can imagine this as useEffect with empty array
  componentDidMount() {
    // this.fetchWeather();
    this.setState({ location: localStorage.getItem('location') || '' });
  }

  //we can imagine this as useEffect with dependency array
  componentDidUpdate(prevProps, prevState) {
    if (prevState.location !== this.state.location) {
      this.fetchWeather();

      localStorage.setItem('location', this.state.location);
    }
  }

  render() {
    const { location, loading, displayCity, weather } = this.state;
    return (
      <div className='app'>
        <h1>Classy Weather</h1>
        <div>
          <Input value={location} onChange={(e) => this.setState({ location: e.target.value })} placeholder={'Enter a city name'} />
        </div>

        {loading && <p className="loading">Loading...</p>}
        {!loading && weather.weathercode && <Weather weather={weather} displayCity={displayCity} />}
      </div>
    )
  }
}
export default App;

class Input extends React.Component {
  render() {
    const { value, onChange, placeholder } = this.props;
    return (
      <input
        placeholder={placeholder}
        type='text'
        value={value}
        onChange={onChange}
      />
    )
  }
}


class Weather extends React.Component {

  componentWillUnmount() {
    console.log('unmount')
  }

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