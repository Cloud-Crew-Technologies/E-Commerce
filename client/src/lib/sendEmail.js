import axios from 'axios';

export const sendEmail = async ({ subject, text, html, to }) => {
  try {
    const response = await axios.post("http://localhost:3000/mail/send-email", {
      subject,
      text,
      html,
      to,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
