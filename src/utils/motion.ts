// Premium Motion System Configurations (Linear / Vercel style)

// Standard Easings
export const EASINGS = {
  smooth: [0.4, 0, 0.2, 1],          // cubic-bezier(0.4, 0, 0.2, 1)
  outSmooth: [0.16, 1, 0.3, 1],      // Apple/Vercel standard ease-out
  inOutSmooth: [0.76, 0, 0.24, 1],
}

// Standard Transitions
export const TRANSITIONS = {
  fast: {
    ease: EASINGS.smooth,
    duration: 0.15, // 150ms
  },
  normal: {
    ease: EASINGS.outSmooth,
    duration: 0.25, // 250ms
  },
  slow: {
    ease: EASINGS.outSmooth,
    duration: 0.4, // 400ms
  },
}

// Reusable Variants
export const VARIANTS = {
  // Meso Animations - Cards / Form items entry
  fadeInUp: {
    initial: {
      opacity: 0,
      y: 8,
      filter: 'blur(4px)',
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: TRANSITIONS.normal,
    },
    exit: {
      opacity: 0,
      y: -8,
      filter: 'blur(4px)',
      transition: TRANSITIONS.fast,
    },
  },

  // Meso Animations - Modal Dialog scale/fade
  modalCard: {
    initial: {
      opacity: 0,
      scale: 0.98,
      y: 12,
      filter: 'blur(4px)',
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: TRANSITIONS.normal,
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 12,
      filter: 'blur(4px)',
      transition: TRANSITIONS.fast,
    },
  },

  // Backdrop Overlay fade
  backdrop: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: TRANSITIONS.normal,
    },
    exit: {
      opacity: 0,
      transition: TRANSITIONS.fast,
    },
  },

  // Slide transitions (left to right, right to left)
  slideInLeft: {
    initial: { opacity: 0, x: -15, filter: 'blur(2px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: TRANSITIONS.normal },
    exit: { opacity: 0, x: 15, filter: 'blur(2px)', transition: TRANSITIONS.fast },
  },

  slideInRight: {
    initial: { opacity: 0, x: 15, filter: 'blur(2px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: TRANSITIONS.normal },
    exit: { opacity: 0, x: -15, filter: 'blur(2px)', transition: TRANSITIONS.fast },
  },

  // Chat message entry (slide up and fade)
  chatMessage: {
    initial: {
      opacity: 0,
      y: 12,
      scale: 0.99,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: TRANSITIONS.normal,
    },
  },
}
