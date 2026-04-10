document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.menu-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const storedTheme = localStorage.getItem('sogapay-theme');
  if (storedTheme) root.setAttribute('data-theme', storedTheme);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  const syncThemeLabel = () => {
    if (!themeToggle) return;
    const dark = root.getAttribute('data-theme') === 'dark';
    themeToggle.textContent = dark ? '☀' : '☾';
    themeToggle.setAttribute(
        'aria-label',
        dark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  };
  syncThemeLabel();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next =
          root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('sogapay-theme', next);
      syncThemeLabel();
    });
  }

  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.14 }
  );

  document
      .querySelectorAll('.reveal')
      .forEach((el) => observer.observe(el));

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const statusEl = document.getElementById('contactFormStatus');

  if (form && submitBtn && statusEl) {
    const setStatus = (msg, type = 'info') => {
      statusEl.textContent = msg;
      statusEl.dataset.state = type;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const payload = {
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        company: String(formData.get('company') || '').trim(),
        message: String(formData.get('message') || '').trim(),
      };

      if (!payload.fullName || !payload.email || !payload.message) {
        setStatus('Please fill in your name, email, and message.', 'error');
        return;
      }

      if (payload.fullName.length < 2) {
        setStatus('Please enter your full name.', 'error');
        return;
      }

      if (payload.message.length < 10) {
        setStatus('Please enter a message of at least 10 characters.', 'error');
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      setStatus('Submitting your inquiry...', 'loading');

      try {
        const res = await fetch('http://sogapay.africa/staging/api/v1/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          const validationMessage =
              data?.details?.fieldErrors
                  ? Object.entries(data.details.fieldErrors)
                      .filter(([, value]) => Array.isArray(value) && value.length)
                      .map(([key, value]) => `${key}: ${value.join(', ')}`)
                      .join(' | ')
                  : '';

          throw new Error(
              validationMessage ||
              data?.message ||
              data?.error ||
              'Failed to submit inquiry.'
          );
        }

        form.reset();
        setStatus(
            data?.message ||
            'Your message has been received. A member of the Soga Pay team will respond shortly.',
            'success'
        );
      } catch (err) {
        setStatus(
            err?.message ||
            'We couldn’t send your message right now. Please try again in a moment.',
            'error'
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Submit inquiry';
      }
    });
  }
});