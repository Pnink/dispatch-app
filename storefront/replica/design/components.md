# Components (Forgecart)

Button      variants primary (ink bg), accent, secondary (border), ghost; sizes sm 32 / md 40 / lg 48; states hover, focus-visible ring-2 accent, disabled, loading (label kept)
Input       label always visible; border-input; focus ring accent; error text danger + aria-invalid
Chip        pill, border; selected = ink bg / on-ink text; aria-pressed
Card        surface or bg + border, radius lg, shadow card; highlighted plan = ink bg
Accordion   native <details>/<summary>, keyboard by default
Toggle      <button role="switch" aria-checked>; on = accent
Table       semantic <table>, sticky header, empty state row
ChatPanel   log with aria-live=polite; input + send; "thinking" dots
Popup       role=dialog aria-modal, Esc closes, focus on close button
ProductArt  generated SVG (shape + palette seeded by product id); alt text = product title
