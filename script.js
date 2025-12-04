// list of section files to load (must match your folder)
const sections = [
    "introduction",
    "about",
    "experience",
    "project",
    "contact",
     "footer"
  ];
  
  // load navbar first, then sections
  fetch("sections/navbar.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("navbar-container").innerHTML = html;
      // after navbar inserted, initialize behavior
      loadAllSections();
    })
    .catch(err => {
      console.error("Failed to load navbar:", err);
    });
  
  function loadAllSections() {
    const content = document.getElementById("content");
    // load each section file and append as a section with id
    Promise.all(sections.map(name =>
      fetch(`sections/${name}.html`)
        .then(r => r.text())
        .then(html => ({ name, html }))
    ))
    .then(results => {
      results.forEach(({name, html}) => {
        // wrap in an element so anchors work
        const wrapper = document.createElement("div");
        wrapper.id = name;                 // e.g., #about
        wrapper.innerHTML = html;
        content.appendChild(wrapper);
      });
  
      // small delay to ensure DOM updated
      setTimeout(() => {
        setupNavLinks();
        setupScrollSpy();
        initExperienceAnimations(); // <-- ensure animation is initialized after sections load
      }, 40);
    })
    .catch(err => console.error("Failed to load sections:", err));
  }
  
  function setupNavLinks() {
    // ensure nav-links scroll to anchors properly, with offset
    // include .nav-cta so Get in Touch works, and .navbar-brand
    const navLinks = document.querySelectorAll('.nav-link, .btn-cta, .navbar-brand, .nav-cta');
  
    // remove previous listeners safely (avoid duplicates)
    navLinks.forEach(link => {
      link.replaceWith(link.cloneNode(true)); // simple way to remove prior handlers
    });
  
    // re-query after clones
    const freshLinks = document.querySelectorAll('.nav-link, .btn-cta, .navbar-brand, .nav-cta');
  
    freshLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = link.getAttribute('href') || "";
        if (!href.startsWith("#")) return;
  
        e.preventDefault();
        const targetId = href.slice(1);
        const el = document.getElementById(targetId);
        if (!el) return;
  
        // compute offset to account for fixed navbar height
        const navHeight = document.querySelector('.navbar-fixed')?.offsetHeight || 0;
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        const scrollTo = elTop - navHeight + 8; // small breathing room
  
        window.scrollTo({ top: scrollTo, behavior: 'smooth' });
  
        // if collapsed on mobile, close it
        const bsCollapse = document.querySelector('.navbar-collapse');
        if (bsCollapse && bsCollapse.classList.contains('show')) {
          const collapse = bootstrap.Collapse.getInstance(bsCollapse);
          if (collapse) collapse.hide();
        }
      });
    });
  }
  
  function setupScrollSpy() {
    const navHeight = document.querySelector('.navbar-fixed')?.offsetHeight || 68;
    const options = {
      root: null,
      rootMargin: `-${navHeight}px 0px 0px 0px`,
      threshold: 0.45 // consider a section active when ~45% visible
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
          if (navLink) navLink.classList.add('active');
        }
      });
    }, options);
  
    // more robust selector: check for any direct children with id inside #content
    document.querySelectorAll('#content > div[id], main > div[id], .section-wrapper[id]').forEach(section => {
      observer.observe(section);
    });
  }
  
  // If user lands with a hash, scroll to it with offset
  window.addEventListener('load', () => {
    if (location.hash) {
      const targetId = location.hash.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        const navHeight = document.querySelector('.navbar-fixed')?.offsetHeight || 0;
        const elTop = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: elTop - navHeight + 8, behavior: 'instant' });
      }
    }
  });
  
  // ---------- Experience fade-up animation initializer ----------
  function initExperienceAnimations() {
    const items = document.querySelectorAll('.exp-item.fade-up');
  
    if (!items.length) return;
  
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target); // animate once
        }
      });
    }, {
      root: null,
      threshold: 0.18
    });
  
    items.forEach(it => io.observe(it));
  }
  
  // ---------- Projects: filters & modal ----------
  (function initProjects() {
    const grid = document.getElementById('project-grid');
    const filtersContainer = document.getElementById('project-filters');
    const modalEl = document.getElementById('projModal');
  
    if (!grid || !filtersContainer) return;
  
    // Collect unique tech tags from cards (data-tech attribute, comma-separated)
    const cards = Array.from(grid.querySelectorAll('.project-card'));
    const techSet = new Set();
    cards.forEach(card => {
      const t = (card.getAttribute('data-tech') || '').split(',').map(s=>s.trim()).filter(Boolean);
      t.forEach(x => techSet.add(x));
    });
  
    // Render filter chips
    const techs = Array.from(techSet).sort();
    filtersContainer.innerHTML = '<span class="filter-chip active" data-tech="all">All</span> ';
    techs.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.setAttribute('data-tech', t);
      chip.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      filtersContainer.appendChild(chip);
    });
  
    // Filter handler
    filtersContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
  
      const filter = chip.getAttribute('data-tech');
      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = '';
          return;
        }
        const tz = (card.getAttribute('data-tech')||'').split(',').map(s=>s.trim());
        card.style.display = tz.includes(filter) ? '' : 'none';
      });
    });
  
    // Modal: bootstrap modal instance
    if (modalEl) {
      const bsModal = new bootstrap.Modal(modalEl);
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-details');
        if (!btn) return;
        const title = btn.getAttribute('data-title') || '';
        const desc = btn.getAttribute('data-desc') || '';
        const repo = btn.getAttribute('data-repo') || '#';
        const live = btn.getAttribute('data-live') || '#';
  
        document.getElementById('projModalLabel').textContent = title;
        document.getElementById('projModalDesc').textContent = desc;
        document.getElementById('projModalRepo').href = repo;
        document.getElementById('projModalLive').href = live;
        // clear images area (you can extend to pass images via data-attributes)
        document.getElementById('projModalImages').innerHTML = '';
  
        bsModal.show();
      });
    }
  })();
  
  
  // ---------- Contact form: simple validation + send (Formspree or mailto fallback) ----------
  (function contactFormHandler() {
    const form = document.getElementById('contactForm');
    if (!form) return;
  
    // Helper: simple email check
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameEl = form.querySelector('#cf-name');
      const emailEl = form.querySelector('#cf-email');
      const subjectEl = form.querySelector('#cf-subject');
      const messageEl = form.querySelector('#cf-message');
  
      // clear previous invalid states
      [nameEl, emailEl, subjectEl, messageEl].forEach(el => el.classList.remove('is-invalid'));
  
      // basic validation
      let invalid = false;
      if (!nameEl.value.trim()) { nameEl.classList.add('is-invalid'); invalid = true; }
      if (!isValidEmail(emailEl.value.trim())) { emailEl.classList.add('is-invalid'); invalid = true; }
      if (!subjectEl.value.trim()) { subjectEl.classList.add('is-invalid'); invalid = true; }
      if (!messageEl.value.trim()) { messageEl.classList.add('is-invalid'); invalid = true; }
  
      if (invalid) {
        // focus first invalid
        const first = form.querySelector('.is-invalid');
        if (first) first.focus();
        return;
      }
  
      // If form has data-form-action set (Formspree or endpoint), POST JSON
      const action = form.getAttribute('data-form-action')?.trim();
  
      const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        subject: subjectEl.value.trim(),
        message: messageEl.value.trim()
      };
  
      try {
        if (action) {
          // POST as JSON (Formspree supports x-www-form-urlencoded too; adapt if needed)
          const res = await fetch(action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
          // success
          form.reset();
          alert('Thanks — your message was sent. I will reply soon.');
        } else {
          // mailto fallback
          const mailto = `mailto:your.email@example.com?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(`Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`)}`;
          window.location.href = mailto;
        }
      } catch (err) {
        console.error('Contact submit error', err);
        alert('Sorry — something went wrong while sending. Please try emailing directly to your.email@example.com');
      }
    });
  })();
  