const request = require('request');
const querystring = require('querystring');

const BASE_URL = 'https://booking.uz.gov.ua/';
const LOCALE_RU = 'ru';
// const LOCALE_EN = 'en';
// const LOCALE_UA = 'ua';

const SECOND = 1000000000;

const trains = async (from, to, date) =>
  new Promise(resolve => {
    const formData = querystring.stringify({
      from,
      to,
      date,
      time: '00:00',
      get_tpl: 1,
    });

    const options = {
      method: 'POST',
      url: `${BASE_URL}${LOCALE_RU}/train_search/`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': formData.length,
      },
      body: formData,
    };

    this.startTime = process.hrtime();

    request(options, (error, response) => {
      if (error) {
        throw new Error(error);
      }

      this.endTime = process.hrtime();
      const start = this.startTime[0] + this.startTime[1] / SECOND;
      const end = this.endTime[0] + this.endTime[1] / SECOND;
      const { statusCode, headers, body } = response;

      try {
        const dataJson = JSON.parse(body || '[]');
        resolve({
          duration: Math.round((end - start) * 1000),
          statusCode,
          headers,
          body: dataJson,
        });
      } catch (errorJsonParse) {
        throw new Error(errorJsonParse);
      }
    });
  });

module.exports = { trains };
