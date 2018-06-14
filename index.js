const { bot } = require('./bot');
const log = require('./log')(module);
const Cron = require('cron').CronJob;

require('dotenv').config();

const chatId = process.env.TELEGRAM_CHAT_ID;
const fromTrain = process.env.CODE_FROM_TRAIN;
const toTrain = process.env.CODE_TO_TRAIN;
const dateTrain = process.env.CODE_DATE_TRAIN;

const { trains } = require('./trains');

const globalTotalTicket = [];

let telegramMassage;

const sendTelegramMessage = async (message, id) => {
  try {
    const response = await bot.sendMessage(id, message, {
      parse_mode: 'HTML',
    });
    return response;
  } catch (error) {
    throw new Error(error);
  }
};

const searchTrain = async () => {
  try {
    const { statusCode, body, error } = await trains(
      fromTrain,
      toTrain,
      dateTrain
    );

    if (statusCode !== 200) {
      throw new Error(`Status code ${statusCode}`);
    }

    if (error === true) {
      throw new Error(body);
    }

    const { list } = body.data;
    telegramMassage = '';

    // console.log(JSON.stringify(list));

    await Promise.all(
      list.map(async (train, number) => {
        let totalTicket = 0;
        let totalTicketL = 0;
        let totalTicketP = 0;
        let totalTicketK = 0;

        let strochka = `🚊 № ${train.num}, ${
          train.from.station
        } - ${train.to.station} - ${train.from.srcDate}:`;

        if (train.types[0]) {
          strochka = `${strochka} ${train.types[0].title} - ${
            train.types[0].places
          },`;
          totalTicketL = train.types[0].places;
        }
        if (train.types[1]) {
          strochka = `${strochka} ${train.types[1].title} - ${
            train.types[1].places
          },`;
          totalTicketK = train.types[1].places;
        }
        if (train.types[2]) {
          strochka = `${strochka} ${train.types[2].title} - ${
            train.types[2].places
          }. `;
          totalTicketP = train.types[2].places;
        }

        log.info(strochka);

        totalTicket = totalTicketL + totalTicketK + totalTicketP;

        if (
          totalTicket > globalTotalTicket[number] ||
          (totalTicket > 0 && globalTotalTicket[number] === undefined)
        ) {
          telegramMassage = `${telegramMassage} ${strochka }\n`;
        }
        globalTotalTicket[number] = totalTicket;
      })
    );
    try {
      await sendTelegramMessage(telegramMassage, chatId);
    } catch (errorSendMassage) {
      throw new Error(errorSendMassage);
    }
  } catch (error) {
    log.error(error);
  }
};

searchTrain();

const job = new Cron({
  cronTime: '0 */10 * * * *',
  onTick() {
    searchTrain();
  },
  start: false,
});

job.start();
