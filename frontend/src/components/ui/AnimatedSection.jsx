/**
 * AnimatedSection.jsx
 * Reusable wrapper that adds Framer Motion entrance animation
 * to any portfolio section. Uses viewport trigger so animation
 * fires only when section scrolls into view.
 */
import { motion } from 'framer-motion';

/**
 * AnimatedSection — wraps children with fade+slide entrance.
 * @param {object}          props
 * @param {React.ReactNode} props.children    - Section content
 * @param {number}          [props.delay=0]   - Stagger delay in seconds
 * @param {string}          [props.className] - Extra CSS classes
 * @param {string}          [props.id]        - Section ID for nav scroll
 */
export default function AnimatedSection({ children, delay = 0, className = '', id }) {
  return (
    <motion.section
      id={id}                                         /* Section anchor for sidebar nav */
      className={className}
      initial={{ opacity: 0, y: 40 }}                 /* Start: invisible + shifted down */
      whileInView={{ opacity: 1, y: 0 }}              /* End: fully visible + in position */
      viewport={{ once: true, amount: 0.12 }}         /* Trigger once when 12% visible */
      transition={{
        duration: 0.75,                               /* Animation duration */
        delay,                                        /* Stagger delay from prop */
        ease: [0.16, 1, 0.3, 1],                     /* Custom spring ease curve */
      }}
    >
      {children}
    </motion.section>
  );
}