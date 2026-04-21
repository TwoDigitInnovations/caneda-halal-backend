const nodemailer = require("nodemailer");
var moment = require("moment");

const comapny = 'MoveEx'

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    // user: '2digitinnovations@gmail.com',
    // pass: 'vtae odtx stfh wovl',
  },
});
const sendMail = async (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const mailConfigurations = {
      from:process.env.MAIL_USER,
      to,
      subject,
      html,
    };
    transporter.sendMail(mailConfigurations, function (error, info) {
      if (error) return reject(error);
      return resolve(info);
    });
  });
};

module.exports = {
  welcomeMail: async (details) => {
    const html = `<div> \r\n<p>Hello,<\/p>\r\n\r\n<p> Welcome to ${comapny}. <\/p>\r\n\r\n<p>You recently created a ${comapny} Account. <\/p>\r\n\r\n<p>Your ${comapny} Registered Mail is: <b>${details.email} <\/b><\/p>\r\n\r\n<p><\/br>Thanks,<\/p>\r\n\r\n<p><b>The ${comapny} Account Team<\/b><\/p>\r\n<\/div>`;
    await sendMail(details.email, `Welcome to ${comapny}`, html);
  },
  sendOTPmail: async ({ email, code }) => {
    try {
      const html = `<div> \r\n<p>Password Reset Instructions<\/p>\r\n\r\n<p>Your ${comapny} One-Time password reset code is: ${code}. Enter online when prompted. This passcode will expire in 5 minutes<\/p><\/br>Thank you for updating your password.<\/p>\r\n\r\n<p><b>${comapny}<\/b><\/p>\r\n<\/div>`;
      return await sendMail(email, "Password Reset Instructions", html);
    } catch (err) {
      console.log(err);
      throw new Error("[sendOTPmail]Could not send OTP mail");
    }
  },
  sendOTPmailForSignup: async ({ email, code }) => {
    try {
      const html = `<div><p>Your Registration OTP</p> <p> Your OTP for registration: ${code}.</p><p> Please use this code to complete your registration.</p><p>Regards,</p><p><b>${comapny}<\/b></p></div>`;
      return await sendMail(email, "Your Registration OTP", html);
    } catch (err) {
      console.log(err);
      throw new Error("[sendOTPmail]Could not send OTP mail");
    }
  },
  passwordChange: async ({ email }) => {
    try {
      const html = `<div> Your password has been reset, if you didn't update your password, please call us on (.) between 9am - 5pm Monday to Friday. \r\n\r\n${comapny}  </div>`;
      return await sendMail(email, "PASSWORD RESET NOTIFICATION EMAIL", html);
    } catch (err) {
      console.log(err);
      throw new Error("[passwordChange]Could not send OTP mail");
    }
  },
  confirmMail: async ({ email }) => {
    try {
      const html = `<div>We are arrive to your loacation in 20-25 minutes  </div>`;
      return await sendMail(email, "Comming for work", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  supportmail: async (detail) => {
    try {
      const html = `<div><p>Hello, ADN Team</p><p>FullName: ${detail.name}</p><p>Email Address: ${detail.email}</p><p>Phone Number: ${detail.phone}</p><p>${detail.description}</p>
      <p>Please check the admin pannel <a href="https://adn-admin.vercel.app/get-in-touch" target="_blank">https://adn-admin.vercel.app/get-in-touch</a></p>
      </div>`;
      // info@adncleaningservices.co.uk
      return await sendMail('info@adncleaningservices.co.uk', "Support", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  bookMail: async ({ user, service, type }) => {
    console.log(user, service, type);
    try {
      // const html = `<div><p>Hi Hannah Pullen,</p>\r\n\r\n<p>Your appointment with ADN Cleaning Services is confirmed.</p>\r\n\r\n\r\n\r\n<p>APPOINTMENT DATE \r\n\r\n Fri, Sep 1, 2023</p>\r\n\r\n<p>APPOINTMENT TIME</p><p>9:30 AM - 10:00 AM</p>\r\n\r\n<p>SERVICE ADDRESS</p><p>33B Tarbert Rd, top flat, London SE22 8QB, UK</p>  </div>`;
      const html = `<div><strong>Dear, ${user.fullName},</strong>
      <br/>
      <p>Thank you for choosing ADN Cleaning Services for your upcoming cleaning appointment!</p>
      <p>Your appointment with ADN Cleaning Services is ${type}. </p>
      
      <p style="margin-top:20px">APPOINTMENT DATE</p>
      <strong>${moment(service.slot.date).format("ddd, MMM DD,YYYY")}
      </strong>
      
      <p style="margin-top:20px">APPOINTMENT TIME
      </p>
      <strong>${service.slot.time}
      </strong>
      
      <p style="margin-top:20px">SERVICE ADDRESS</p>
      <strong>${service.location}
      </strong></div>
      
      <p>To track your service status or make changes, please log in to your account on our  <a href="https://www.adncleaningservices.com/" target="_blank">website</a> .</p>
      <p>If you have any specific requests or questions, Feel free to download our <a href="https://play.google.com/store/apps/details?id=com.adnuser.app" target="_blank"> ADN User app </a> to stay updated with your booking.</p>
  
      <p>Thanks and Regards</p>
      <p><strong>ADN Cleaning Services</strong></p>
      `;
      return await sendMail(user.email, "Appointment Confirmation", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  bookMailtoAdmin: async ({ user, service, type }) => {
    console.log(user, service, type);
    try {
      // const html = `<div><p>Hi Hannah Pullen,</p>\r\n\r\n<p>Your appointment with ADN Cleaning Services is confirmed.</p>\r\n\r\n\r\n\r\n<p>APPOINTMENT DATE \r\n\r\n Fri, Sep 1, 2023</p>\r\n\r\n<p>APPOINTMENT TIME</p><p>9:30 AM - 10:00 AM</p>\r\n\r\n<p>SERVICE ADDRESS</p><p>33B Tarbert Rd, top flat, London SE22 8QB, UK</p>  </div>`;
      const html = `<div><strong>Dear ADN Team,</strong>
      <br/>
      <p>We are having a booking for the service ${service.name}!</p>
      <strong>Client Email : ${user.email}
      </strong>
      <p style="margin-top:20px">APPOINTMENT DATE</p>
      <strong>${moment(service.slot.date).format("ddd, MMM DD,YYYY")}
      </strong>
      
      <p style="margin-top:20px">APPOINTMENT TIME
      </p>
      <strong>${service.slot.time}
      </strong>
      
      <p style="margin-top:20px">SERVICE ADDRESS</p>
      <strong>${service.location}
      </strong></div>
      
      <p>Thanks and Regards</p>
      <p><strong> ${user.fullName}</strong></p>
      `;
      return await sendMail('info@adncleaningservice.co.uk', type, html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  bookReminder: async ({ user, service, type }) => {
    console.log(user, service, type);
    try {
      // const html = `<div><p>Hi Hannah Pullen,</p>\r\n\r\n<p>Your appointment with ADN Cleaning Services is confirmed.</p>\r\n\r\n\r\n\r\n<p>APPOINTMENT DATE \r\n\r\n Fri, Sep 1, 2023</p>\r\n\r\n<p>APPOINTMENT TIME</p><p>9:30 AM - 10:00 AM</p>\r\n\r\n<p>SERVICE ADDRESS</p><p>33B Tarbert Rd, top flat, London SE22 8QB, UK</p>  </div>`;
      const html = `<div><strong>Hi, ${user.fullName},</strong>
      <br/>
      <p>You have an upcoming appointment for ${type}. </p>
      
      <p style="margin-top:20px">APPOINTMENT DATE</p>
      <strong>${moment(service.slot.date).format("ddd, MMM DD,YYYY")}
      </strong>
      
      <p style="margin-top:20px">APPOINTMENT TIME
      </p>
      <strong>${service.slot.time}
      </strong>
      
      <p style="margin-top:20px">SERVICE ADDRESS</p>
      <strong>${service.location}
      </strong></div>`;
      return await sendMail(user.email, "Appointment Confirmation", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  followUP: async ({ user, service, type }) => {
    console.log(user, service, type);
    try {
      // const html = `<div><p>Hi Hannah Pullen,</p>\r\n\r\n<p>Your appointment with ADN Cleaning Services is confirmed.</p>\r\n\r\n\r\n\r\n<p>APPOINTMENT DATE \r\n\r\n Fri, Sep 1, 2023</p>\r\n\r\n<p>APPOINTMENT TIME</p><p>9:30 AM - 10:00 AM</p>\r\n\r\n<p>SERVICE ADDRESS</p><p>33B Tarbert Rd, top flat, London SE22 8QB, UK</p>  </div>`;
      const html = `<div><strong>Hi, ${user.fullName},</strong>
      <br/>
      <p>Thank you for choosing ADN Cleaning Services.We work really hard to provide the best experience for our customers and are always looking for ways to improve. If you have a second to rate the service ${type} , we would appreciate your feedback.  <br/>   <br/> All the best, ADN Cleaning Services </p>
      
      `;
      return await sendMail(user.email, "Appointment Confirmation", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  bookCancelMail: async ({ email }) => {
    try {
      const html = `<div>We are arrive to your loacation in 20-25 minutes  </div>`;
      return await sendMail(email, "Booking Cancelation", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  bookRescheduled: async ({ user, service, type }) => {
    console.log(user, service, type);
    try {
      // const html = `<div><p>Hi Hannah Pullen,</p>\r\n\r\n<p>Your appointment with ADN Cleaning Services is confirmed.</p>\r\n\r\n\r\n\r\n<p>APPOINTMENT DATE \r\n\r\n Fri, Sep 1, 2023</p>\r\n\r\n<p>APPOINTMENT TIME</p><p>9:30 AM - 10:00 AM</p>\r\n\r\n<p>SERVICE ADDRESS</p><p>33B Tarbert Rd, top flat, London SE22 8QB, UK</p>  </div>`;
      const html = `<div><strong>Hi, ${user.fullName},</strong>
      <br/>
      <p>Your appointment for ${type} has been successfully rescheduled. </p>
      
      <p style="margin-top:20px">NEW DATE</p>
      <strong>${moment(service.slot.date).format("ddd, MMM DD,YYYY")}
      </strong>
      
      <p style="margin-top:20px">NEW APPOINTMENT TIME
      </p>
      <strong>${service.slot.time}
      </strong>
      
      <p style="margin-top:20px">SERVICE ADDRESS</p>
      <strong>${service.location}
      </strong></div>`;
      return await sendMail(user.email, "Appointment Confirmation", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
  sendmessage: async ({ email,message }) => {
    try {
      const html = `<p>Testing message for keyake.${message}</p>`;
      return await sendMail(email, "Mail subject", html);
    } catch (err) {
      console.log(err);
      throw new Error("something went wrong");
    }
  },
};
