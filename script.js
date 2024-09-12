const key = "9e7975b6addbfccd3caf8fd278ecc0c4";
let darkMode = false;

// Function to fetch weather data by city name
function fetchWeatherData() {
    const cityName = document.getElementById('cityInput').value;
    if (cityName) {
        let url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${key}`;
        fetchWeather(url);
    }
}

// Function to fetch weather data by coordinates (latitude and longitude)
function fetchWeatherDataByCoords(lat, lon) {
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    fetchWeather(url);
}

// Fetch weather data from OpenWeatherMap API
function fetchWeather(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "404") {
                renderError();
            } else {
                renderWeather(data);
                fetchForecastData(data.coord.lat, data.coord.lon);
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            renderError();
        });
}


// Function to fetch forecast data by coordinates
function fetchForecastData(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`)
        .then(response => response.json())
        .then(data => {
            const dailyData = processDailyForecast(data.list);
            renderForecast(dailyData);
        })
        .catch(error => {
            console.error('Error fetching forecast data:', error);
            renderError();
        });
}

// Function to process daily forecast data
function processDailyForecast(list) {
    const dailyData = {};
    
    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format

        if (!dailyData[day]) {
            dailyData[day] = [];
        }
        
        dailyData[day].push(item);
    });

    // Get first 6 days (including today)
    return Object.keys(dailyData).slice(0, 6).map(day => dailyData[day]);
}


// Render weather data to the DOM
function renderWeather(data) {
    const { name, main, weather, wind } = data;
    const weatherContainer = document.getElementById('weatherContainer');
    weatherContainer.innerHTML = `
        <div class="weather-info p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 h-full">
            <h2 class="text-2xl font-semibold mb-4">${name}</h2>
            <div class="flex justify-between items-center mb-4">
                <div>
                    <p class="text-4xl font-bold">${main.temp.toFixed(1)}&deg;C</p>
                    <p class="text-xl">${weather[0].description}</p>
                </div>
                <div>
                    <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}" class="w-24 h-24">
                </div>
            </div>
            <div class="mt-4">
                <p class="text-lg">Feels like: ${main.feels_like.toFixed(1)}&deg;C</p>
                <p class="text-lg">Humidity: ${main.humidity}%</p>
                <p class="text-lg">Wind: ${wind.speed} m/s</p>
            </div>
        </div>
    `;
}

// Modify the renderForecast function
function renderForecast(data) {
    const forecastContainerTop = document.getElementById('forecastContainerTop');
    const forecastContainerBottom = document.getElementById('forecastContainerBottom');
    forecastContainerTop.innerHTML = '';
    forecastContainerBottom.innerHTML = '';

    data.forEach((dailyItems, index) => {
        const firstItem = dailyItems[0];
        const date = new Date(firstItem.dt * 1000);
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

        // Calculate the average temperature and other details for the day
        const avgTemp = (dailyItems.reduce((sum, item) => sum + item.main.temp, 0) / dailyItems.length).toFixed(1);
        const description = dailyItems[0].weather[0].description;
        const icon = dailyItems[0].weather[0].icon;
        const humidity = (dailyItems.reduce((sum, item) => sum + item.main.humidity, 0) / dailyItems.length).toFixed(1);
        const windSpeed = (dailyItems.reduce((sum, item) => sum + item.wind.speed, 0) / dailyItems.length).toFixed(1);

        const forecastCard = `
            <div class="forecast-item">
                <h3 class="text-lg font-semibold">${dayOfWeek}</h3>
                <div class="flex justify-between items-center mt-2">
                    <p class="text-2xl font-bold">${avgTemp}&deg;C</p>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" class="w-20">
                </div>
                <p>${description}</p>
                <p>Humidity: ${humidity}%</p>
                <p>Wind: ${windSpeed} m/s</p>
            </div>
        `;

        if (index < 3) {
            forecastContainerTop.innerHTML += forecastCard;
        } else {
            forecastContainerBottom.innerHTML += forecastCard;
        }
    });
}

// Render error message if weather data is not available
function renderError() {
    const weatherContainer = document.getElementById('weatherContainer');
    weatherContainer.innerHTML = `
        <div class="dataNotAvailable p-4 rounded-lg shadow-md bg-red-500 text-white">
            <p>Weather data not available. Please check the city name or try again later.</p>
        </div>
    `;
}

// Function to open the map modal
function openModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    initMap();
}

// Function to close the map modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// Function to initialize Leaflet map and geocoder
function initMap() {
    const map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const options = {
        key: 'f2bcfb32d1f441e786bcae761a2f81cd',
        limit: 10
    };

    L.Control.geocoder(options)
        .on('markgeocode', function(e) {
            const { lat, lng } = e.geocode.center;
            fetchWeatherDataByCoords(lat, lng);
            closeModal();
        })
        .addTo(map);

    map.on('click', function(e) {
        const query = `${e.latlng.lat},${e.latlng.lng}`;
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${options.key}`)
            .then(response => response.json())
            .then(data => {
                const result = data.results[0];
                if (result) {
                    fetchWeatherDataByCoords(result.geometry.lat, result.geometry.lng);
                    closeModal();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
}

// Function to toggle dark mode
function toggleDarkMode() {
var button = document.getElementById("modeToggleButton");
var currentMode = document.body.classList.contains("dark-mode") ? "White Mode" : "Dark Mode";

// Toggle dark mode class on body
document.body.classList.toggle("dark-mode");

// Update button text based on current mode
if (currentMode === "Dark Mode") {
button.textContent = "White Mode";
button.classList.remove("bg-gray-500", "hover:bg-gray-600", "text-white");
button.classList.add("bg-gray-100", "hover:bg-gray-200", "text-gray-900");
} else {
button.textContent = "Dark Mode";
button.classList.remove("bg-gray-100", "hover:bg-gray-200", "text-gray-900");
button.classList.add("bg-gray-500", "hover:bg-gray-600", "text-white");
}
}

// Function to get user's current location and fetch weather data
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherDataByCoords(latitude, longitude);
        }, error => {
            console.error('Error getting user location:', error);
            fetchWeatherData('Belgaum'); // Default city if geolocation fails
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        fetchWeatherData('Belgaum'); // Default city if geolocation is not supported
    }
}

// Add event listener for the Enter key on the input field
document.getElementById('cityInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        fetchWeatherData();
    }
});

// Fetch weather data for the user's current location when the app is opened
getUserLocation();