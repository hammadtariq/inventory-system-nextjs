import { useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import styles from "@/styles/Landing.module.css";

export default function PublicDemoModal({ open, onClose, triggerRef }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open || !modalRef.current) return;

    const trigger = triggerRef?.current;
    const focusable = [
      ...modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ];
    focusable[0]?.focus();

    function trapTab(e) {
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trapTab);
    return () => {
      document.removeEventListener("keydown", trapTab);
      trigger?.focus();
    };
  }, [open, triggerRef]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    onClose();
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <m.div
            className={styles.modalOverlay}
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <m.div
              ref={modalRef}
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-heading"
            >
              <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close dialog">
                ✕
              </button>
              <h2 className={styles.modalHeading} id="modal-heading">
                Request a demo
              </h2>
              <p className={styles.modalSub}>We will reach out within 24 hours to schedule your walkthrough.</p>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="demo-name">
                    Full name
                  </label>
                  <input
                    id="demo-name"
                    className={styles.formInput}
                    type="text"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="demo-email">
                    Business email
                  </label>
                  <input
                    id="demo-email"
                    className={styles.formInput}
                    type="email"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="demo-company">
                    Company name
                  </label>
                  <input
                    id="demo-company"
                    className={styles.formInput}
                    type="text"
                    placeholder="Your company"
                    required
                    autoComplete="organization"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="demo-size">
                    Team size
                  </label>
                  <select id="demo-size" className={styles.formSelect} required>
                    <option value="">Select team size</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="200+">200+ employees</option>
                  </select>
                </div>
                <button type="submit" className={styles.formSubmit}>
                  Submit request →
                </button>
              </form>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
