/* =====================================================================
   SITE CONFIG — edit everything here.
   Links, prices, barbers, gallery photos, reviews and hours all live in
   this one object. Save the file and refresh; no build step.
   ===================================================================== */
const SITE = {
  links: {
    booking: "https://culture815.booksy.com",
    reviews: "https://culture815.booksy.com",
    facebook: "https://facebook.com/TheCulture815",
    phone: "+18152500010",          // used for tel: links
    phoneDisplay: "(815) 250-0010",
    directions: "https://www.google.com/maps/dir/?api=1&destination=415+5th+St%2C+Peru%2C+IL+61354",
  },

  // price is in dollars; time is shown as written
  services: [
    { name: "Adult Haircut",                     price: 30, time: "45 min" },
    { name: "Adult Haircut w/ Beard",            price: 35, time: "1 hr" },
    { name: "Adult Haircut + Eyebrows",          price: 35, time: "45 min" },
    { name: "Adult Haircut w/ Beard + Eyebrows", price: 40, time: "1 hr" },
    { name: "Beard Trim Only",                   price: 15, time: "45 min" },
    { name: "Kids Cut",                          price: 20, time: "45 min", note: "12 & under" },
  ],

  // photo: path like "images/barbers/beto.jpg". Leave "" to show a placeholder.
  // booking: each barber's personal Booksy link. Leave "" to use links.booking.
  barbers: [
    { name: "Beto Ramos",      role: "Barber", photo: "", booking: "", bio: "Placeholder bio: specialties, years cutting, favorite style to do." },
    { name: "Oscar",           role: "Barber", photo: "", booking: "", bio: "Placeholder bio: specialties, years cutting, favorite style to do." },
    { name: "Alex",            role: "Barber", photo: "", booking: "", bio: "Placeholder bio: specialties, years cutting, favorite style to do." },
    { name: "Adonai Sandoval", role: "Barber", photo: "", booking: "", bio: "Placeholder bio: specialties, years cutting, favorite style to do." },
    { name: "Marco",           role: "Barber", photo: "", booking: "", bio: "Placeholder bio: specialties, years cutting, favorite style to do." },
  ],

  // 6–9 photos. src: "images/gallery/cut-1.jpg". Leave "" for a placeholder.
  gallery: [
    { src: "", alt: "Skin fade with textured top" },
    { src: "", alt: "Taper with hard part" },
    { src: "", alt: "Beard shape-up and lineup" },
    { src: "", alt: "Kids cut, low fade" },
    { src: "", alt: "Burst fade with design" },
    { src: "", alt: "Classic scissor cut" },
  ],

  // PLACEHOLDER reviews. Replace with real quotes from Booksy (with permission).
  reviews: [
    { text: "Placeholder review. Best fade I've had in the Valley. In and out on time, and the new shop is clean.", name: "Client name", service: "Adult Haircut" },
    { text: "Placeholder review. Booked on Booksy, no wait, and my beard has never looked this sharp.", name: "Client name", service: "Haircut w/ Beard" },
    { text: "Placeholder review. Great with my son. He actually sat still and loved his cut.", name: "Client name", service: "Kids Cut" },
  ],

  // 24-hour times in Central Time. null = closed. Index 0 = Sunday.
  hours: [
    null,                               // Sun
    null,                               // Mon
    { open: "09:00", close: "18:00" },  // Tue
    { open: "09:00", close: "18:00" },  // Wed
    { open: "09:00", close: "18:00" },  // Thu
    { open: "09:00", close: "18:00" },  // Fri
    { open: "09:00", close: "17:00" },  // Sat
  ],
  hoursNote: "Closed Sunday and Monday. Some barbers take Monday appointments; check Booksy.",
  timeZone: "America/Chicago",
};

/* =====================================================================
   Below here is site code. You shouldn't need to edit it.
   ===================================================================== */
(function () {
  "use strict";

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function placeholder(label, file, dark) {
    return `<div class="ph${dark ? " ph-dark" : ""}" role="img" aria-label="Placeholder: ${esc(label)}">
      <span class="ph-tag">Photo placeholder</span>
      <span class="ph-label">${esc(label)}<br><code>${esc(file)}</code></span>
    </div>`;
  }

  function to12h(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
  }

  // Apply links from config to every [data-link] anchor
  function applyLinks() {
    const L = SITE.links;
    const map = {
      booking: L.booking,
      reviews: L.reviews,
      facebook: L.facebook,
      directions: L.directions,
      phone: "tel:" + L.phone,
    };
    document.querySelectorAll("[data-link]").forEach((a) => {
      const href = map[a.dataset.link];
      if (href) a.href = href;
    });
  }

  function renderServices() {
    const list = $("#service-list");
    if (!list) return;
    list.innerHTML = SITE.services.map((s) => `
      <li class="price-item">
        <span class="price-name">${esc(s.name)}</span>
        <span class="price-meta">
          <span>${esc(s.time)}</span>${s.note ? `<span class="note">${esc(s.note)}</span>` : ""}
        </span>
        <span class="price-amount">$${esc(s.price)}</span>
      </li>`).join("");
  }

  function renderTeam() {
    const list = $("#team-list");
    if (!list) return;
    list.innerHTML = SITE.barbers.map((b) => {
      const first = b.name.split(" ")[0];
      const file = `images/barbers/${slug(first)}.jpg`;
      const media = b.photo
        ? `<img src="${esc(b.photo)}" alt="${esc(b.name)}, barber at Culture Barbershop" loading="lazy" width="480" height="600">`
        : placeholder(`Portrait of ${b.name}`, file);
      return `
      <li class="reveal">
        <article class="barber">
          ${media}
          <div class="barber-body">
            <p class="barber-role">${esc(b.role)}</p>
            <h3 class="barber-name">${esc(b.name)}</h3>
            <p class="barber-bio">${esc(b.bio)}</p>
            <a class="btn" href="${esc(b.booking || SITE.links.booking)}" target="_blank" rel="noopener">Book with ${esc(first)}</a>
          </div>
        </article>
      </li>`;
    }).join("");
  }

  function renderGallery() {
    const list = $("#gallery-list");
    if (!list) return;
    list.innerHTML = SITE.gallery.map((g, i) => {
      const media = g.src
        ? `<img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy" width="600" height="600">`
        : placeholder(g.alt, `images/gallery/cut-${i + 1}.jpg`, true);
      return `<li class="reveal">${media}</li>`;
    }).join("");
  }

  function renderReviews() {
    const list = $("#review-list");
    if (!list) return;
    list.innerHTML = SITE.reviews.map((r) => `
      <li class="reveal">
        <figure class="review">
          <span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span>
          <blockquote>${esc(r.text)}</blockquote>
          <figcaption><strong>${esc(r.name)}</strong><span>${esc(r.service)}</span></figcaption>
        </figure>
      </li>`).join("");
  }

  function hoursLabel(h) {
    return h ? `${to12h(h.open)} – ${to12h(h.close)}` : "Closed";
  }

  // Current day + minutes in the shop's time zone, regardless of visitor's zone
  function shopNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SITE.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: SHORT.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  }

  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

  function openStatus() {
    const { day, minutes } = shopNow();
    const today = SITE.hours[day];
    if (today && minutes >= toMin(today.open) && minutes < toMin(today.close)) {
      return { open: true, short: "Open now", text: `Open now · until ${to12h(today.close)}`, day };
    }
    if (today && minutes < toMin(today.open)) {
      return { open: false, short: "Closed", text: `Closed · opens today at ${to12h(today.open)}`, day };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (SITE.hours[d]) {
        const when = i === 1 ? "tomorrow" : DAY_NAMES[d];
        return { open: false, short: "Closed", text: `Closed · opens ${when} at ${to12h(SITE.hours[d].open)}`, day };
      }
    }
    return { open: false, short: "Closed", text: "Closed", day };
  }

  // Display order: Monday first
  const ORDER = [1, 2, 3, 4, 5, 6, 0];

  function renderHours() {
    const status = openStatus();

    const tbody = $("#hours-table tbody");
    if (tbody) {
      tbody.innerHTML = ORDER.map((d) => {
        const h = SITE.hours[d];
        const today = d === status.day;
        return `<tr class="${today ? "is-today" : ""}"${today ? ' aria-current="date"' : ""}>
          <th scope="row">${DAY_NAMES[d]}</th>
          <td class="${h ? "" : "closed"}">${hoursLabel(h)}</td>
        </tr>`;
      }).join("");
    }
    const note = $("#hours-note");
    if (note) note.textContent = SITE.hoursNote;

    const footer = $("#footer-hours");
    if (footer) {
      footer.innerHTML = [
        ["Tue–Fri", hoursLabel(SITE.hours[2])],
        ["Sat", hoursLabel(SITE.hours[6])],
        ["Sun–Mon", "Closed"],
      ].map(([d, t]) => `<li><span>${d}</span><span>${t}</span></li>`).join("");
    }

    const pill = $("[data-open-pill]");
    if (pill) {
      pill.classList.toggle("is-open", status.open);
      pill.classList.toggle("is-closed", !status.open);
      $("[data-open-text]", pill).textContent = status.text;
    }
    const fact = $("[data-open-status]");
    if (fact) {
      fact.textContent = status.short;
      fact.classList.toggle("is-open", status.open);
      fact.classList.toggle("is-closed", !status.open);
      const detail = $("[data-open-detail]");
      if (detail) detail.textContent = status.text.split("· ")[1] || "";
    }
  }

  function setupNav() {
    const toggle = $(".nav-toggle");
    const nav = $("#site-nav");
    if (!toggle || !nav) return;
    const close = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { close(); toggle.focus(); }
    });
  }

  function setupReveal() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-motion");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 60}ms`;
      io.observe(el);
    });
  }

  applyLinks();
  renderServices();
  renderTeam();
  renderGallery();
  renderReviews();
  renderHours();
  setupNav();
  setupReveal();
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
  // Keep "Open now" accurate if the page stays open
  setInterval(renderHours, 60 * 1000);
})();
