/**
 * NotFound.jsx — Professional Geometric 404
 * Purpose: Interactive technical interface for missing routes.
 */

import React from 'react';
import { motion } from 'framer-motion';
// import Button from '../components/ui/Button';
// import ParticleBackground from '../components/ui/ParticleBackground';
import '../styles/pages/NotFound.css';

/**
 * Geometric404 - A high-end geometric representation of 404.
 */
const Geometric404 = () => (
  <svg
    className="not-found__geo-svg"
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Geometric 4 - Left */}
    <path className="geo-path pulse-1" d="M40 140V60L100 140H120V60" stroke="#c8ff57" strokeWidth="4" strokeLinecap="square" />

    {/* Geometric 0 - Middle (Hexagon style) */}
    <path className="geo-path pulse-2" d="M160 100L180 60H220L240 100L220 140H180L160 100Z" stroke="#c8ff57" strokeWidth="4" />

    {/* Geometric 4 - Right */}
    <path className="geo-path pulse-3" d="M280 140V60L340 140H360V60" stroke="#c8ff57" strokeWidth="4" strokeLinecap="square" />

    {/* Subtle Data lines */}
    <line x1="20" y1="160" x2="380" y2="160" stroke="#c8ff57" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="10 5" />
  </svg>
);

export default function NotFound() {
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="not-found">
      <ParticleBackground />
      <div className="not-found__vignette" />

      <motion.div
        className="not-found__content"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
      >
        {/* Geometric Visual */}
        <motion.div className="not-found__geo-container" variants={itemVariants}>
          <Geometric404 />
        </motion.div>

        {/* Minimalist Text */}
        <motion.div className="not-found__text-block" variants={itemVariants}>
          <h2 className="not-found__status">CONNECTION LOST</h2>
          <p className="not-found__msg">The requested node is unavailable.</p>
        </motion.div>

        {/* Minimalist Actions */}
        <motion.div className="not-found__actions" variants={itemVariants}>
          <Button variant="primary" size="lg" href="/">
            RE-ESTABLISH HOME
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}