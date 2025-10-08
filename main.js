  // Scroll-Animation (fade-in beim Scrollen)
  document.addEventListener('DOMContentLoaded', function() {
    const selectors = ['.service'];
    const faders = document.querySelectorAll(selectors.join(','));
    const appearOptions = { threshold: 0.2 };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!entry.target.classList.contains('fade-up-animate')) {
          entry.target.classList.add('fade-up-animate');
        }
        observer.unobserve(entry.target);
      });
    }, appearOptions);
    faders.forEach(fader => {
      appearOnScroll.observe(fader);
    });
  });