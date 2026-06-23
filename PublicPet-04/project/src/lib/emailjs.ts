import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_Jok';
const EMAILJS_TEMPLATE_ID = 'template_JokoC';
const EMAILJS_PUBLIC_KEY = 'joko_public_key_123';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailData {
  to_name: string;
  to_email: string;
  service_type: string;
  booking_type: 'Nurse_Booking' | 'Service_Inquiry' | 'Contact';
  service_details?: string;
  start_date?: string;
  duration?: string;
}

export const sendBookingConfirmationEmail = async (data: EmailData): Promise<void> => {
  try {
    const templateParams = {
      to_name: data.to_name,
      to_email: data.to_email,
      service_type: data.service_type,
      booking_type: data.booking_type,
      service_details: data.service_details || '',
      start_date: data.start_date || '',
      duration: data.duration || '',
      from_name: 'Joko Nursing Agency',
      reply_to: 'jokonursing@gmail.com',
      message: `Thank you for booking with Joko Nursing Agency! We have received your request for ${data.service_type}. Our team will contact you soon to confirm your booking and arrange the service.`
    };

    console.log('Sending email with params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};