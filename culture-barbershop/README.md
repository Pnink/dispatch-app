# Culture Barbershop website

A one-page site built with plain HTML, CSS and JavaScript. It has no build step and no framework.

```
culture-barbershop/
├── index.html          page structure, SEO tags, LocalBusiness schema
├── css/styles.css      all styling
├── js/main.js          SITE config (top of file) + site code
├── images/
│   ├── barbers/        barber portraits go here
│   ├── gallery/        haircut photos go here
│   ├── og-image.jpg    preview image for links shared on Facebook/texts
│   └── favicon.svg
└── netlify.toml        optional Netlify settings
```

## Editing content

Almost everything lives in the `SITE` object at the top of **`js/main.js`**.

### Prices and services
```js
services: [
  { name: "Adult Haircut", price: 30, time: "45 min" },
  { name: "Kids Cut", price: 20, time: "45 min", note: "12 & under" },
]
```
Change a number, add a line, or delete a line. The menu updates on its own.
If the price range changes, also update `"priceRange"` in the schema block in `index.html`.

### Barbers and their Booksy links
```js
{ name: "Beto Ramos", role: "Barber", photo: "", booking: "", bio: "..." }
```
- `booking`: paste the barber's personal Booksy link. Left empty, it uses the main shop link.
- `photo`: e.g. `"images/barbers/beto.jpg"`. Left empty, it shows a marked placeholder.
- `bio`: one or two sentences.

### Main links
`SITE.links` holds the Booksy, Facebook, phone and directions links. Every button on the page reads from here.

### Hours
`SITE.hours` is listed Sunday through Saturday in 24-hour Central Time; `null` means closed.
The "Open now / Closed" badge and the highlighted "Today" row use these values. If the hours change, also update `openingHoursSpecification` in `index.html` so Google sees the same hours.

### Reviews
`SITE.reviews` holds three **placeholder** quotes. Replace them with real Booksy reviews (ask the client first).

### About text
The shop story is written directly in `index.html` under `<!-- 2. ABOUT -->`. Delete the "Placeholder copy" note once it's replaced.

## Adding photos

Every placeholder shows a **PHOTO PLACEHOLDER** tag and the file path it expects.

1. Export photos as JPG, about 1200px on the long side (portraits 4:5, gallery square).
2. Put them in `images/barbers/` or `images/gallery/`.
3. Set the path in `js/main.js` (`photo:` for barbers, `src:` for gallery). Write a short, accurate `alt` for each gallery photo.
4. Shop interior photo: in `index.html`, replace the `<div class="ph ph-tall" ...>` block in the About section with
   `<img src="images/shop.jpg" alt="Inside Culture Barbershop in Peru, IL" width="960" height="1200">`.

## Deploying (free)

**Netlify (drag and drop):** go to https://app.netlify.com/drop and drop the whole `culture-barbershop` folder. You get a live URL in seconds.

**Netlify or Vercel from Git:** push the folder to a GitHub repo, import it in Netlify or Vercel, leave the build command empty, and set the publish/output directory to the folder root.

**After you have the final URL** (e.g. a custom domain), find and replace `https://culture815.netlify.app/` in `index.html` so the canonical link, Open Graph tags and schema point to the real address.

## Checklist before handing to the client
- [ ] Real barber photos, bios and personal Booksy links
- [ ] 6–9 real haircut photos
- [ ] Real About story and real reviews
- [ ] Final domain set in `index.html`
- [ ] Test the Book and Call buttons on a phone
