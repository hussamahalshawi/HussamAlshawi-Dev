/**
 * FeedbackSection.jsx
 * ─────────────────────────────────────────────────────────
 * Feedback & testimonials section with contact form.
 *
 * Layout:
 *   Left: Testimonial cards
 *   Right: Contact form
 *
 * Data: feedback from usePortfolioData (GET /api/feedback/featured)
 * ─────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import feedbackService from '../../services/feedbackService';
import '../../styles/components/FeedbackSection.css';

/* ── Animation variants ─────────────────────────────────────── */
const CARD_VARIANTS = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const CARD_TRANSITION = {
  duration: 0.5,
  ease:     [0.4, 0, 0.2, 1],
};

/* ── Theme colors ───────────────────────────────────────────── */
const COLORS = {
  dark: ['#4ECCA3', '#4FC3F7', '#9B7FEA', '#F5A623', '#F06292'],
  light: ['#1a9e6e', '#1a8fc7', '#7c5bd4', '#d07a10', '#d0406a'],
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function FeedbackSection({ feedback }) {
  const { isDark } = useTheme();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const testimonials = feedback?.testimonials || [];

  /* ── Contact form state ───────────────────────────────────── */
  const [form, setForm] = useState({ name: '', email: '', company: '', job_title: '', message: '' });
  const [formStatus, setFormStatus] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: null, message: '' });

    try {
      const result = await feedbackService.submitFeedback(form);
      if (result.data?.success) {
        setFormStatus({ type: 'success', message: result.data.message || 'Thank you! Your message has been sent.' });
        setForm({ name: '', email: '', company: '', job_title: '', message: '' });
      } else {
        const errors = result.data?.errors || {};
        const firstError = Object.values(errors)[0] || 'Something went wrong';
        setFormStatus({ type: 'error', message: firstError });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.message || 'Failed to send message. Please try again.';
      setFormStatus({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     TESTIMONIAL CARDS (LEFT)
     ════════════════════════════════════════════════════════════ */
  const Testimonials = () => (
    <motion.div
      className="fb-panel fb-testimonials"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.0 }}
    >
      <div className="fb-panel__header">
        <span className="fb-panel__title">Testimonials</span>
        <span className="fb-panel__sub">{testimonials.length} feedback{testimonials.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="fb-testimonials__list">
        {testimonials.map((t, i) => {
          const accentColor = colors[i % colors.length];
          const initials = (t.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div className="fb-testimonial" key={i}>
              <div className="fb-testimonial__quote">
                <svg viewBox="0 0 24 24" width="16" height="16" fill={accentColor} opacity="0.3">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
                <p className="fb-testimonial__text">{t.message}</p>
              </div>
              <div className="fb-testimonial__footer">
                <div className="fb-testimonial__avatar" style={{ background: accentColor + '20', color: accentColor }}>
                  {initials}
                </div>
                <div className="fb-testimonial__author">
                  <span className="fb-testimonial__name">{t.name}</span>
                  {(t.job_title || t.company) && (
                    <span className="fb-testimonial__role">
                      {t.job_title}{t.company ? ` at ${t.company}` : ''}
                    </span>
                  )}
                </div>
                {t.submitted_at && (
                  <span className="fb-testimonial__date">
                    {new Date(t.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {testimonials.length === 0 && (
          <div className="fb-empty">No testimonials yet</div>
        )}
      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     CONTACT FORM (RIGHT)
     ════════════════════════════════════════════════════════════ */
  const ContactForm = () => (
    <motion.div
      className="fb-panel fb-form-panel"
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ ...CARD_TRANSITION, delay: 0.05 }}
    >
      <div className="fb-panel__header">
        <span className="fb-panel__title">Get in Touch</span>
        <span className="fb-panel__sub">Send a message</span>
      </div>

      <form className="fb-form" onSubmit={handleSubmit}>
        <div className="fb-form__row">
          <div className="fb-form__field">
            <label className="fb-form__label" htmlFor="fb-name">Name *</label>
            <input
              className="fb-form__input"
              id="fb-name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="fb-form__field">
            <label className="fb-form__label" htmlFor="fb-email">Email *</label>
            <input
              className="fb-form__input"
              id="fb-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="fb-form__row">
          <div className="fb-form__field">
            <label className="fb-form__label" htmlFor="fb-company">Company</label>
            <input
              className="fb-form__input"
              id="fb-company"
              name="company"
              type="text"
              placeholder="Company name"
              value={form.company}
              onChange={handleChange}
            />
          </div>
          <div className="fb-form__field">
            <label className="fb-form__label" htmlFor="fb-job">Job Title</label>
            <input
              className="fb-form__input"
              id="fb-job"
              name="job_title"
              type="text"
              placeholder="Your role"
              value={form.job_title}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="fb-form__field">
          <label className="fb-form__label" htmlFor="fb-message">Message *</label>
          <textarea
            className="fb-form__textarea"
            id="fb-message"
            name="message"
            required
            rows={5}
            placeholder="Your message..."
            value={form.message}
            onChange={handleChange}
          />
        </div>

        {formStatus.message && (
          <div className={`fb-form__status fb-form__status--${formStatus.type}`}>
            {formStatus.message}
          </div>
        )}

        <button
          className="fb-form__submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <section id="feedback" className="feedback-section" aria-label="Feedback">
      <div className="fb-grid">
        <Testimonials />
        <ContactForm />
      </div>
    </section>
  );
}
