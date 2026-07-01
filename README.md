# Jorge Petit-Laurent — personal site

Static HTML/CSS/JS, no build step and no framework — this repository *is* the deployed site. Bilingual (Spanish default, English toggle), served at [pinkypetit.github.io](https://pinkypetit.github.io).

## Structure

- `index.html` — page structure: the inline icon `<symbol>` sprite (has to live inline in the document — a sprite referenced from an external file can't have its shapes restyled cross-document via CSS classes), the identity name/bio flip, language toggle, the bento grid, and the modal skeleton.
- `css/styles.css` — design tokens (Light Botanical palette, visible warm borders, 4px radius), the bento grid's masonry layout (`grid-auto-rows` + explicit `grid-row: span` per size tier, so mixed tiers never produce blank gaps), the two-tone icon hover-recolor system, and the modal + photo carousel.
- `js/data.js` — the `I18N_EN` dictionary powering the `data-i18n` system (Spanish is the default, baked directly into the HTML so the page works even if this script fails to load), and `CARD_DATA`, the full bilingual content for every bento box.
- `js/main.js` — language toggle, identity flip, scroll-reveal (`IntersectionObserver`), modal open/close with a focus trap, and the photo carousel (CSS scroll-snap driven, with prev/next/dot controls and keyboard navigation).
- `assets/fonts/` — Fraunces, Work Sans, IBM Plex Mono, self-hosted as WOFF2 (no CDN).
- `assets/images/` — real photos, converted to WebP.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Fonts and the icon sprite don't load reliably over `file://` in some browsers — serve the folder instead of opening `index.html` directly.)
