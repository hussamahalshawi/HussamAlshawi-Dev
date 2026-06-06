/**
 * useFeedback.js
 * ─────────────────────────────────────────────────────────
 * Hook for the contact form and featured testimonials.
 * Testimonials load lazily on intersection.
 * Form submission is available immediately (no intersection needed).
 *
 * Usage:
 *   const { testimonials, submit, submitting, submitted, error, sectionRef }
 *     = useFeedback();
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';      // React primitives
import feedbackService                              from '../services/feedbackService'; // Feedback API
import { useIntersectionLoader }                    from '../services/useIntersectionLoader';     // Shared observer

/**
 * useFeedback — loads testimonials on intersection + handles form submission.
 *
 * @param {React.RefObject} [externalRef] - Optional external ref
 *
 * @returns {{
 *   testimonials: Array,      - Featured testimonial records
 *   submit:       Function,   - Call with form payload to submit feedback
 *   submitting:   boolean,    - True while form POST is in flight
 *   submitted:    boolean,    - True after successful submission
 *   submitError:  string|null,- Form submission error message
 *   loading:      boolean,    - True while testimonials are loading
 *   error:        string|null,- Testimonials load error
 *   sectionRef:   React.RefObject
 * }}
 */
export function useFeedback(externalRef = null) {

  /* ── Ref management ── */
  const internalRef = useRef(null);                            // Fallback ref
  const sectionRef  = externalRef || internalRef;              // Prefer external

  /* ── Intersection trigger — for testimonials load ── */
  const triggered = useIntersectionLoader(sectionRef);         // Fires once when visible

  /* ── Testimonials state ── */
  const [testimonials, setTestimonials] = useState([]);        // Featured testimonial records
  const [loading,      setLoading]      = useState(false);     // True while loading testimonials
  const [error,        setError]        = useState(null);      // Testimonials load error

  /* ── Form submission state ── */
  const [submitting,  setSubmitting]  = useState(false);       // True while POST is in flight
  const [submitted,   setSubmitted]   = useState(false);       // True after success
  const [submitError, setSubmitError] = useState(null);        // Form submission error

  /* ── Load testimonials when section enters viewport ── */
  useEffect(() => {
    if (!triggered) return;                                    // Wait until visible

    let cancelled = false;

    async function fetchTestimonials() {
      setLoading(true);
      setError(null);

      try {
        /* GET /feedback/featured — approved testimonials only */
        const data = await feedbackService.getFeaturedTestimonials();
        if (!cancelled) setTestimonials(data?.testimonials || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load testimonials.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTestimonials();
    return () => { cancelled = true; };

  }, [triggered]);

  /* ── Form submission handler — available immediately ── */
  const submit = useCallback(async (payload) => {
    setSubmitting(true);                                       // Show submit spinner
    setSubmitError(null);                                      // Clear previous error
    setSubmitted(false);                                       // Reset success flag

    try {
      /* POST /feedback — submit contact form */
      await feedbackService.submitFeedback(payload);
      setSubmitted(true);                                      // Mark as submitted
    } catch (err) {
      setSubmitError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);                                    // Always hide spinner
    }
  }, []);

  return {
    testimonials, loading, error,                              // Testimonials data
    submit, submitting, submitted, submitError,                // Form state
    sectionRef,                                                // Ref for section element
  };
}

export default useFeedback;                                    // Default export