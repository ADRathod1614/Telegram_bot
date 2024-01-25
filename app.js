const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

//Telegram API
const token = '6940010980:AAGybBlbwQ7FE__9a-NeE8nv7YkA4osyVxk';
const bot = new TelegramBot(token, {polling: true});

//Weather API
const openWeatherMapApiKey = 'b190a0605344cc4f3af08d0dd473dd25';

const subscribedUsers = [];

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `Welcome to WeatherBot! Send me the name of a city to get the current weather or type /subscribe to get daily weather updates.`;
  bot.sendMessage(chatId, welcomeMessage);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const cityName = msg.text;

  try {
    // Get the current weather for the specified city
    const weatherResponse = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${openWeatherMapApiKey}`);
    const weatherData = weatherResponse.data;

    // Send the current weather to the user
    const weatherMessage = `Current weather in ${weatherData.name}:\n\n${weatherData.weather[0].description}\nTemperature: ${weatherData.main.temp}°C\nHumidity: ${weatherData.main.humidity}%`;
    bot.sendMessage(chatId, weatherMessage);
   }
  catch (error) {
    console.error(error);
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text.toLowerCase();

  if (messageText.includes('subscribe')) {
    subscribedUsers.push(chatId);
    bot.sendMessage(chatId, `You have been subscribed to daily weather updates.`);
  }
});

const sendDailyWeatherUpdates = async () => {
  try {
    const currentDate = new Date();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(currentDate.getDate() + 1);

    const forecastResponse = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?appid=${openWeatherMapApiKey}`);
    const forecastData = forecastResponse.data;

    const tomorrowForecasts = forecastData.list.filter(forecast => {
      const forecastDate = new Date(forecast.dt * 1000);
      return forecastDate.getDate() === tomorrowDate.getDate() && forecastDate.getMonth() === tomorrowDate.getMonth() && forecastDate.getFullYear() === tomorrowDate.getFullYear();
    });

    subscribedUsers.forEach(chatId => {
      let forecastMessage = `Daily weather update for tomorrow:\n\n`;

      tomorrowForecasts.forEach(forecast => {
        const forecastCity = forecast.name;
        const forecastDescription = forecast.weather[0].description;
        const forecastTemperature = forecast.main.temp;

        forecastMessage += `- ${forecastCity}: ${forecastDescription}, ${forecastTemperature}°C\n`;
      });

      bot.sendMessage(chatId, forecastMessage);
    });
  } catch (error) {
    console.error(error);
  }
};

// Send daily weather updates at 6:00 AM every day
const cron = require('node-cron');
cron.schedule('0 6 * * *', sendDailyWeatherUpdates);