import { useState } from 'react';
import { FaFacebookF } from 'react-icons/fa6';
import { FaInstagram } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { FaLinkedinIn } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { FaPhoneAlt } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { IoMail } from 'react-icons/io5';
import emailjs from '@emailjs/browser';
import Contactus from '../../assets/Contact us.svg';
import Title from '../../assets/title.svg';
import Navbar from '../../Pages/LandingPage/Navbar/Navbar';
import Footer from '../../Pages/LandingPage/Footer/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../ContactUs/notification.css';
import { validateContactForm } from '../../utils/validateContactForm.js';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validationError = validateContactForm(formData);
    if (validationError) {
      toast.error(validationError, {
        autoClose: 2000,
        className: 'toast-custom',
        style: {
          borderRadius: '10px',
        },
      });
      return;
    }

    setIsSubmitting(true);

    toast.info('Sending...', {
      autoClose: 2000,
      className: 'toast-custom ',
      style: {
        borderRadius: '10px',
      },
    });

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const triggerMailtoFallback = () => {
      const subjectEncoded = encodeURIComponent(formData.subject);
      const bodyEncoded = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
      );
      const mailtoUrl = `mailto:Sebinmathew543@gmail.com?subject=${subjectEncoded}&body=${bodyEncoded}`;

      // Dispatch explicit anchor click to launch native mail app (iOS / Android / Windows)
      const link = document.createElement('a');
      link.href = mailtoUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (!navigator.onLine || !serviceId || !templateId || !publicKey) {
      toast.dismiss();
      triggerMailtoFallback();
      toast.info(
        !navigator.onLine
          ? 'You are offline. Opening email app...'
          : 'Opening your email app to send message...',
        {
          autoClose: 3000,
          className: 'toast-custom',
          style: { borderRadius: '10px' },
        },
      );
      setIsSubmitting(false);
      return;
    }

    const templateParams = {
      name: formData.name,
      from_name: formData.name,
      email: formData.email,
      from_email: formData.email,
      reply_to: formData.email,
      subject: formData.subject,
      message: formData.message,
    };

    emailjs
      .send(serviceId, templateId, templateParams, publicKey)
      .then(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        toast.dismiss();
        toast.success('Message sent successfully!', {
          autoClose: 2000,
          className: 'toast-custom',
          style: {
            borderRadius: '10px',
          },
        });
      })
      .catch((err) => {
        console.error('EmailJS send error:', err);
        toast.dismiss();
        triggerMailtoFallback();
        toast.info('Opening your email app to send message...', {
          autoClose: 3000,
          className: 'toast-custom',
          style: {
            borderRadius: '10px',
          },
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // NOTE: no Enter-to-advance keydown interception here anymore — it called
  // preventDefault() on Enter in every single-line input, which blocked the
  // native form submission entirely: a keyboard user could never submit with
  // Enter (only Tab-to-button + Enter). Diagnosed by probe; restored the
  // standard expectation that Enter in a text input submits the form. The
  // textarea keeps its native newline behavior (no handler attached).

  return (
    <div
      className="contact-container bg-[#101011] flex flex-col min-h-screen justify-between scroll-mt-24"
      id="contact"
    >
      <Navbar />
      <h1 className="sr-only">Contact FOCES</h1>

      <div className="font-Grotesk flex-grow flex flex-col justify-center py-10 max-[767px]:pt-[15vh]">
        <div className="flex items-center md:hidden">
          <div className="flex items-center pl-8">
            <div className="inline-block w-5 h-16 bg-[#4f4f54] relative"></div>
            <img
              className="absolute w-52 h-[25px] pl-2.5"
              data-aos="flip-up"
              data-aos-duration="750"
              src={Contactus}
              alt="Contact Us"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
        <div className="text-white w-full flex justify-center items-center">
          <div className="flex flex-col-reverse md:flex-row md:space-x-6 md:space-y-0 space-y-6 w-full p-4 md:p-8 rounded-xl justify-center items-center md:items-baseline">
            <div className="flex flex-col space-y-4 justify-center items-baseline">
              <div className="md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8">
                <div className="items-center hidden md:block mt-4">
                  <div className="flex items-center">
                    <div
                      className="inline-block w-5 h-16 bg-[#4f4f54] relative"
                      data-aos="flip-up"
                      data-aos-duration="750"
                    ></div>
                    <img
                      className="absolute w-52  pl-2.5"
                      data-aos="flip-up"
                      data-aos-duration="750"
                      src={Contactus}
                      alt="Contact Us"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
              <div className="flex text-lg flex-col space-y-4 m-4 sm:ml-[0px]">
                <div className="mb-4 flex  ">
                  <img
                    className="pt-2 w-44 h-[25px] "
                    src={Title}
                    alt="We're here"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="mb-4  flex flex-row items-baseline">
                  <FaLocationDot />
                  <span className="pl-1.5  text-lg">
                    College of Engineering Chengannur
                    <br />
                    Chengannur P.O.
                    <br />
                    Alappuzha District.
                  </span>
                </div>
                <div className="  mb-4 text-lg inline-flex space-x-2 items-center">
                  <FaPhoneAlt />
                  <span>+91-479-2454125</span>
                </div>
                <div className="mb-4 text-lg inline-flex space-x-2 items-center">
                  <IoMail />
                  <a
                    href="mailto:Sebinmathew543@gmail.com"
                    className="hover:underline hover:text-cyan-400 transition-colors"
                  >
                    Sebinmathew543@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-lg mt-4">
                <a
                  href="https://www.facebook.com/focescec?mibextid=JRoKGi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit FOCES Facebook page"
                  className="bg-white text-black p-2 rounded-md hover:bg-cyan-400 hover:text-black transition-all duration-200"
                >
                  <FaFacebookF size={18} className="w-4.5 h-4.5" aria-hidden="true" />
                </a>
                <div className="border-r border-white/40 h-5" />
                <a
                  href="https://x.com/foces_cec?t=e__UXOl9tQFznh7JG8kqzQ&s=08"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit FOCES X (Twitter) profile"
                  className="bg-white text-black p-2 rounded-md hover:bg-cyan-400 hover:text-black transition-all duration-200"
                >
                  <FaXTwitter size={18} className="w-4.5 h-4.5" aria-hidden="true" />
                </a>
                <div className="border-r border-white/40 h-5" />
                <a
                  href="https://www.instagram.com/foces_cec?igsh=b2E3bjNpbGgzdG03"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit FOCES Instagram page"
                  className="bg-white text-black p-2 rounded-md hover:bg-cyan-400 hover:text-black transition-all duration-200"
                >
                  <FaInstagram size={18} className="w-4.5 h-4.5" aria-hidden="true" />
                </a>
                <div className="border-r border-white/40 h-5" />
                <a
                  href="https://www.linkedin.com/in/foces-cec-423176229/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit FOCES LinkedIn profile"
                  className="bg-white text-black p-2 rounded-md hover:bg-cyan-400 hover:text-black transition-all duration-200"
                >
                  <FaLinkedinIn size={18} className="w-4.5 h-4.5" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="">
              <div className="pl-[18px] font-medium flex flex-col space-y-4 md:mb-[-15px] items-center">
                <div className="text-lg">
                  Got some unique ideas that you want to implement or improve?
                </div>
                <div className="font-semibold">SHARE WITH US!</div>
              </div>
              <div className="p-4">
                {/* noValidate: type=email triggers native browser validation on
                    submit, which would swallow our custom toast + messaging.
                    Validation lives in validateForm() (JS) instead. */}
                <form
                  className="flex flex-col space-y-1 text-black"
                  onSubmit={sendEmail}
                  noValidate
                >
                  <div>
                    <label htmlFor="name" className="text-sm text-white">
                      Name
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-4 py-2 mt-2 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm text-white">
                      Email
                    </label>
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-4 py-2 mt-2 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="text-sm text-white">
                      Subject
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-4 py-2 mt-2 bg-white text-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="text-sm text-white">
                      Tell us more about your idea here !!
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      name="message"
                      id="message"
                      placeholder=""
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full rounded-lg px-4 py-2 mt-2 bg-white text-black"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center text-black bg-white px-4 py-2 rounded-md hover:bg-gray-100 transition-opacity ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? 'Sending...' : 'Send'}
                        <IoSend className="ml-2" />
                      </button>
                    </div>
                  </div>
                  <div></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />
    </div>
  );
}

export default ContactUs;
