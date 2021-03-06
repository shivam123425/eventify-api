const { sendEmail } = require("../helpers/sendEmail");
const generateRandomToken = require("../helpers/generateRandomToken");
const { newEventEmailContent } = require("../helpers/generateHTMLContent");
const ParticipationToken = require("../models/ParticipationToken");
const { getClient } = require("../config/redisConfig");

function generateTokenPromises(count, size) {
  const tokenPromiseArr = [];
  for (let i = 0; i < count; i++) {
    tokenPromiseArr.push(generateRandomToken(size));
  }
  return tokenPromiseArr;
}
async function generateParticipationIds(
  eventId,
  emailArr,
  size,
  { expirationDate, expirationInSeconds }
) {
  try {
    const count = emailArr.length;
    const tokenArr = await Promise.all(generateTokenPromises(count, size));
    const participationTokens = [];
    for (let i = 0; i < count; i++) {
      participationTokens.push(
        new ParticipationToken({
          token: `PI-${eventId}-${tokenArr[i]}`,
          recipient: emailArr[i],
          eventId,
          expiration: expirationDate,
        })
      );
    }
    await ParticipationToken.insertMany(participationTokens);
    // save the tokens in redis and mongodb
    const redisClient = getClient();
    participationTokens.forEach(({ token, recipient }) => {
      redisClient.set(token, recipient, "EX", expirationInSeconds);
    });
    return participationTokens;
  } catch (error) {
    throw error;
  }
}

module.exports = async (event, sender, emailArr, tokenExpiration) => {
  const savedParticipationTokens = await generateParticipationIds(
    event.eventId,
    emailArr,
    2,
    tokenExpiration
  );
  const { subject, genHtml } = newEventEmailContent(event, sender);
  const htmlArr = [];
  for (let i = 0; i < emailArr.length; i++) {
    htmlArr.push(genHtml(savedParticipationTokens[i].token));
  }
  sendEmail(emailArr, subject, htmlArr);
};
