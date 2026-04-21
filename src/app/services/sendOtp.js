
const mongoose = require("mongoose");
const Verification = mongoose.model("Verification");
const twilio = require("twilio");
const { getDatewithAddedMinutes } = require("../helper/user");


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const otpExpiration = 5  //in min


async function sendTwilioSms(to, text) {
  console.log("tooooooooooo=>", to);
  const client = new twilio(accountSid, authToken);
  await client.messages
    .create({
      body: text,
      to,
      from: process.env.FROM_NUMBER,
    })
    .then((message) => console.log('res',message.sid));
}

module.exports = {
  sendOtp: async (countrycode,phone) => {

    let ver = await Verification.findOne({ phone });
    let ran_otp = Math.floor(1000 + Math.random() * 9000);
    // Math.floor(1000 + Math.random() * 9000);
    console.log(ver)
    if (!ver) {
      ver = new Verification({
        phone: phone,
        otp: ran_otp,
        expiration_at: getDatewithAddedMinutes(otpExpiration),
      });
      await ver.save();
      const t = `Your verification code is: ${ran_otp}. It is valid for 5 minutes.`;
      console.log(t)
      await sendTwilioSms(`+${countrycode}${phone}`, t);
    } else {
      if (new Date().getTime() > new Date(ver.expiration_at).getTime()) {
        await Verification.findOneAndUpdate(
          { phone },
          {
            otp: ran_otp,
            verified: false,
            expiration_at: getDatewithAddedMinutes(otpExpiration),
          }
        );
        const t = `Your verification code is: ${ran_otp}. It is valid for 5 minutes.`;
        await sendTwilioSms(`+${countrycode}${phone}`, t);
      } else {
        const vv = await Verification.findOneAndUpdate(
          { phone },
          {
            otp: ran_otp,
            verified: false,
            expiration_at: getDatewithAddedMinutes(otpExpiration),
          }
        );
        const t = `Your verification code is: ${ran_otp}. It is valid for 5 minutes.`;
        await sendTwilioSms(`+${countrycode}${phone}`, t);
      }
    }

    // await sendTwilioSms(`91${phone}`, t);
  },
};
