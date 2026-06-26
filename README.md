# WK-pruik.nl

Statische, mobielvriendelijke productsite voor GitHub Pages.

## Bestanden

- `index.html`: product/landingpage
- `styles.css`: responsive styling
- `script.js`: klikgedrag, video-popup en lokale statistieken
- `assets/`: lokale SVG-afbeeldingen

## Live zetten via GitHub Pages

1. Push deze map naar een GitHub repository.
2. Open in GitHub: `Settings` > `Pages`.
3. Kies `Deploy from a branch`.
4. Selecteer je hoofdbranch en `/root`.
5. Na publicatie draait de site zonder build-stap.

## Video aanpassen

De popupvideo speelt lokaal af via `assets/movie.mp4` en loopt in een ping-pong animatie: vooruit, achteruit, daarna opnieuw.

## Analytics toevoegen

De site telt lokaal al:

- `pageviews`
- `clicks`
- `videoOpens`
- `ctaClicks`

Voor echte analytics kun je in `index.html` vlak voor `</head>` je GA4-script plaatsen. De site stuurt daarnaast al events via `window.dataLayer` en `gtag()` als die aanwezig zijn.

## Google advertenties toevoegen

De pagina laadt nu je AdSense clientscript en bevat al twee responsive advertentieblokken. Voor echte live advertenties moet je in de `ins.adsbygoogle` elementen nog je definitieve `data-ad-slot` toevoegen vanuit AdSense.
