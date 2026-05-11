/**
 * ContactForm.jsx — Contact Section with Form and Info Column
 * ─────────────────────────────────────────────────────────
 * Left: glassmorphism form panel with validation and submission feedback
 * Right: email, phone, address, social links from profile API
 * Submits to POST /api/feedback via feedbackService.
 * Panel has gloss line, water-droplet texture, and focus glow on inputs.
 * ─────────────────────────────────────────────────────────
 */
import { useState }         from 'react';                    // Form state management
import Button               from '../ui/Button';             // Reusable button component
import { useProfile }       from '../../hooks/useProfile';  // Profile data for contact info
import feedbackService      from '../../services/feedbackService'; // Feedback API calls
import { SOCIAL_PLATFORMS } from '../../utils/constants';   // Social platforms config
import '../../styles/components/ContactForm.css';            // Component-specific styles

/**
 * ContactForm — full contact section component.
 * Handles: field state, validation, API submission, success/error feedback.
 */
export default function ContactForm() {
  const { profile } = useProfile();                         // Profile for contact info

  // ── Form field state ─────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    name:      '',                                          // Visitor's name
    email:     '',                                          // Visitor's email
    company:   '',                                          // Company (optional)
    job_title: '',                                          // Job title (optional)
    message:   '',                                          // Message body
  });

  const [errors,     setErrors]     = useState({});         // Validation error map
  const [submitting, setSubmitting] = useState(false);      // True while API call in progress
  const [submitted,  setSubmitted]  = useState(false);      // True after successful submit
  const [apiError,   setApiError]   = useState(null);       // Server-side error message

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));        // Update single field
    setErrors(prev => ({ ...prev, [name]: '' }));           // Clear field error on change
  };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!fields.name.trim())
      newErrors.name = 'Name is required.';

    if (!fields.email.trim())
      newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      newErrors.email = 'Enter a valid email address.';

    if (!fields.message.trim())
      newErrors.message = 'Message is required.';
    else if (fields.message.trim().length < 20)
      newErrors.message = 'Message must be at least 20 characters.';

    return newErrors;
  };

  // ── Form submission ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);                          // Show all validation errors
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      await feedbackService.submitFeedback(fields);         // POST /api/feedback
      setSubmitted(true);                                   // Show success state
      setFields({ name: '', email: '', company: '', job_title: '', message: '' });
    } catch (err) {
      setApiError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Active social links ──────────────────────────────────────────────────
  const activeSocials = SOCIAL_PLATFORMS.filter(
    p => profile?.social?.[p.key]
  );

  return (
    <section id="contact" className="section">
      <div className="container">

        {/* ── Section header ── */}
        <div className="s-head">
          <span className="s-tag">Contact</span>
          <h2 className="s-title">Let's Work Together</h2>
          <p className="s-sub">
            Have a project in mind or want to discuss a role? Send a message.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="contact-wrap">

          {/* ════════════════════════
              LEFT: Contact form
          ════════════════════════ */}
          {submitted ? (
            /* ── Success state ── */
            <div
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                justifyContent:  'center',
                textAlign:       'center',
                padding:         'var(--s12)',
                position:        'relative',
                overflow:        'hidden',
                borderRadius:    'var(--r-2xl)',
                background:      'rgba(14, 20, 40, 0.80)',
                backdropFilter:  'blur(24px)',
                border:          '1px solid rgba(255,255,255,0.09)',
                boxShadow:       '0 16px 48px rgba(0,0,0,0.45)',
              }}
            >
              <p style={{ fontSize: '2.5rem', marginBottom: 'var(--s4)' }}>✅</p>
              <h3 style={{
                fontFamily:   'var(--font-display)',
                fontSize:     '1.8rem',
                marginBottom: 'var(--s2)',
                color:        'var(--text-white)',
              }}>
                Message Sent!
              </h3>
              <p style={{
                color:        'var(--text-secondary)',
                marginBottom: 'var(--s6)',
                fontSize:     '0.88rem',
              }}>
                I'll get back to you as soon as possible.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmitted(false)}           // Reset to form
              >
                Send Another
              </Button>
            </div>
          ) : (
            <div className="contact-form">

              {/* API-level error banner */}
              {apiError && (
                <div style={{
                  background:   'rgba(240, 98, 146, 0.10)',
                  border:       '1px solid rgba(240, 98, 146, 0.30)',
                  borderRadius: 'var(--r-md)',
                  padding:      'var(--s3) var(--s4)',
                  color:        '#F06292',
                  fontSize:     '0.82rem',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          'var(--s2)',
                }}>
                  ⚠ {apiError}
                </div>
              )}

              {/* Row 1: Name + Email */}
              <div className="form-row">
                <FormField
                  label="Name *"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={fields.name}
                  error={errors.name}
                  onChange={handleChange}
                />
                <FormField
                  label="Email *"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={fields.email}
                  error={errors.email}
                  onChange={handleChange}
                />
              </div>

              {/* Row 2: Company + Job title */}
              <div className="form-row">
                <FormField
                  label="Company"
                  name="company"
                  type="text"
                  placeholder="Your company (optional)"
                  value={fields.company}
                  error={errors.company}
                  onChange={handleChange}
                />
                <FormField
                  label="Job Title"
                  name="job_title"
                  type="text"
                  placeholder="Your role (optional)"
                  value={fields.job_title}
                  error={errors.job_title}
                  onChange={handleChange}
                />
              </div>

              {/* Message textarea */}
              <div className="form-group">
                <label className="form-group__label">Message *</label>
                <textarea
                  name="message"
                  placeholder="Describe your project or opportunity..."
                  className="form-group__textarea"
                  value={fields.message}
                  onChange={handleChange}
                  rows={5}
                  style={errors.message ? { borderColor: '#F06292' } : {}}
                />
                {errors.message && (
                  <span style={{
                    color:     '#F06292',
                    fontSize:  '0.72rem',
                    marginTop: 'var(--s1)',
                  }}>
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Submit button */}
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={handleSubmit}
                style={{ alignSelf: 'flex-start' }}
              >
                {submitting ? 'Sending…' : 'Send Message →'}
              </Button>
            </div>
          )}

          {/* ════════════════════════
              RIGHT: Contact info
          ════════════════════════ */}
          <div className="contact-info">

            {/* Email */}
            {profile?.email && (
              <ContactInfoItem
                icon="✉"
                label="Email"
                value={profile.email}
                href={`mailto:${profile.email}`}
              />
            )}

            {/* Phone */}
            {profile?.phone && (
              <ContactInfoItem
                icon="📞"
                label="Phone"
                value={profile.phone}
                href={`tel:${profile.phone}`}
              />
            )}

            {/* Address */}
            {profile?.address && (
              <ContactInfoItem
                icon="📍"
                label="Location"
                value={profile.address}
              />
            )}

            {/* Social links */}
            {activeSocials.length > 0 && (
              <div className="socials-row">
                {activeSocials.map(platform => (
                  <a
                    key={platform.key}
                    href={profile.social[platform.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="soc-btn"
                    aria-label={`Visit ${platform.label} profile`}
                  >
                    {platform.icon} {platform.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FormField — labeled input with optional validation error message.
 * @param {{ label, name, type, placeholder, value, error, onChange }} props
 */
function FormField({ label, name, type, placeholder, value, error, onChange }) {
  return (
    <div className="form-group">
      <label className="form-group__label">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="form-group__input"
        value={value}
        onChange={onChange}
        style={error ? { borderColor: '#F06292' } : {}}    // Red border on validation error
      />
      {error && (
        <span style={{
          color:     '#F06292',
          fontSize:  '0.72rem',
          marginTop: 'var(--s1)',
        }}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * ContactInfoItem — single contact detail row with icon and glassmorphism card.
 * @param {{ icon, label, value, href }} props
 */
function ContactInfoItem({ icon, label, value, href }) {
  return (
    <div className="ci-item">
      <div className="ci-item__icon" aria-hidden="true">{icon}</div>
      <div>
        <p className="ci-item__label">{label}</p>
        {href
          ? <a href={href} className="ci-item__value">{value}</a>
          : <p className="ci-item__value">{value}</p>
        }
      </div>
    </div>
  );
}