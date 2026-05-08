/**
 * ContactForm.jsx — Contact section with form and info column
 * Left: contact form with validation and submission feedback
 * Right: email, phone, address, social links from profile
 * Submits to POST /api/feedback via feedbackService.
 */
import { useState }        from 'react';                      // Form state management
import Button              from '../ui/Button';               // Reusable button component
import { useProfile }      from '../../hooks/useProfile';    // Profile data for contact info
import feedbackService     from '../../services/feedbackService'; // Feedback API
import { SOCIAL_PLATFORMS } from '../../utils/constants';    // Social platforms config

/**
 * ContactForm — full contact section component.
 * Handles: field state, validation, API submission, success/error feedback.
 */
export default function ContactForm() {
  const { profile } = useProfile();                           // Profile for contact info column

  // ── Form field state ─────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    name:      '',                                            // Visitor's name
    email:     '',                                            // Visitor's email
    company:   '',                                            // Company (optional)
    job_title: '',                                            // Job title (optional)
    message:   '',                                            // Message body
  });

  const [errors,     setErrors]     = useState({});          // Validation error map
  const [submitting, setSubmitting] = useState(false);       // True while API call is in progress
  const [submitted,  setSubmitted]  = useState(false);       // True after successful submission
  const [apiError,   setApiError]   = useState(null);        // Server-side error message

  // ── Field change handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));          // Update single field
    setErrors(prev => ({ ...prev, [name]: '' }));             // Clear field error on change
  };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!fields.name.trim())
      newErrors.name = 'Name is required.';                   // Required field check

    if (!fields.email.trim())
      newErrors.email = 'Email is required.';                 // Required field check
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      newErrors.email = 'Enter a valid email address.';       // Format check

    if (!fields.message.trim())
      newErrors.message = 'Message is required.';             // Required field check
    else if (fields.message.trim().length < 20)
      newErrors.message = 'Message must be at least 20 characters.'; // Min length

    return newErrors;
  };

  // ── Form submission ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = validate();                      // Run validation

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);                            // Show all validation errors
      return;                                                 // Stop submission
    }

    setSubmitting(true);                                      // Show loading state
    setApiError(null);                                        // Clear previous API error

    try {
      await feedbackService.submitFeedback(fields);           // POST /api/feedback
      setSubmitted(true);                                     // Show success message
      setFields({ name: '', email: '', company: '', job_title: '', message: '' }); // Reset
    } catch (err) {
      setApiError(err.message || 'Failed to send message. Please try again.'); // Show error
    } finally {
      setSubmitting(false);                                   // Hide loading state
    }
  };

  // ── Social links from profile ────────────────────────────────────────────
  const activeSocials = SOCIAL_PLATFORMS.filter(
    p => profile?.social?.[p.key]                             // Only non-null URLs
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
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Message Sent!
              </h3>
              <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
                I'll get back to you as soon as possible.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)}>
                Send Another
              </Button>
            </div>
          ) : (
            <div className="contact-form">

              {/* API-level error banner */}
              {apiError && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-coral)',
                  fontSize: '0.84rem',
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
                  style={errors.message ? { borderColor: 'var(--color-coral)' } : {}}
                />
                {errors.message && (
                  <span style={{ color: 'var(--color-coral)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
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
              <ContactInfoItem icon="✉" label="Email" value={profile.email} href={`mailto:${profile.email}`} />
            )}

            {/* Phone */}
            {profile?.phone && (
              <ContactInfoItem icon="📞" label="Phone" value={profile.phone} href={`tel:${profile.phone}`} />
            )}

            {/* Address */}
            {profile?.address && (
              <ContactInfoItem icon="📍" label="Location" value={profile.address} />
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
 * FormField — a labeled input with optional error message.
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
        style={error ? { borderColor: 'var(--color-coral)' } : {}} /* Red border on error */
      />
      {error && (
        <span style={{ color: 'var(--color-coral)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * ContactInfoItem — a single contact detail row with icon.
 */
function ContactInfoItem({ icon, label, value, href }) {
  return (
    <div className="ci-item">
      <div className="ci-item__icon">{icon}</div>
      <div>
        <p className="ci-item__label">{label}</p>
        {href
          ? <a href={href} className="ci-item__value" style={{ textDecoration: 'none' }}>{value}</a>
          : <p className="ci-item__value">{value}</p>
        }
      </div>
    </div>
  );
}