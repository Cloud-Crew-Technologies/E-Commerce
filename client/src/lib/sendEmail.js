import axios from 'axios';

export const sendEmail = async ({ subject, text, html, to }) => {
  try {
    const response = await axios.post("https://ecommerceapi.skillhiveinnovations.com/mail/send-email", {
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
