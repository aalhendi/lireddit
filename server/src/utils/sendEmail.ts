import nodemailer from "nodemailer";

export async function sendEmail(to: string, html: string) {
  try {
    // Mailhog localhost
    const transporter = nodemailer.createTransport({
      host: "127.0.0.1",
      port: 1025,
      auth: {
        user: "user",
        pass: "password",
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"lireddit support" <support@lireddit.com>', // sender address
      to: to, // list of receivers
      subject: "Password Reset", // Subject line
      //   text: text, // plain text body
      html: html, // html body
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Preview URL: http://localhost:8025");
  } catch (error) {
    console.error(error);
  }
}
