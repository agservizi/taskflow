import { motion, AnimatePresence } from 'framer-motion';

// ── Varianti globali ──

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

export const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const slideIn = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

// ── Stagger per liste ──

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

// ── Tap / hover per bottoni ──

export const tapScale = {
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

export const tapBounce = {
  whileTap: { scale: 0.92 },
  whileHover: { scale: 1.02 },
  transition: { type: 'spring', stiffness: 500, damping: 15 },
};

// ── Modale slide-up ──

export const modalVariants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { opacity: 0, y: '100%', transition: { duration: 0.2 } },
};

export const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Componenti pronti all'uso ──

export const MotionPage = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
);

export const MotionList = ({ children, className, ...props }) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="initial"
    animate="animate"
    {...props}
  >
    {children}
  </motion.div>
);

export const MotionItem = ({ children, className, style, onClick, ...props }) => (
  <motion.div
    className={className}
    style={style}
    onClick={onClick}
    variants={staggerItem}
    whileTap={{ scale: 0.97 }}
    {...props}
  >
    {children}
  </motion.div>
);

export const MotionCard = ({ children, className, style, onClick, ...props }) => (
  <motion.div
    className={className}
    style={style}
    onClick={onClick}
    variants={staggerItemScale}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    {...props}
  >
    {children}
  </motion.div>
);

export const MotionButton = ({ children, as: Tag = 'button', ...props }) => (
  <motion.button
    whileTap={{ scale: 0.93 }}
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    {...props}
  >
    {children}
  </motion.button>
);

export { motion, AnimatePresence };
