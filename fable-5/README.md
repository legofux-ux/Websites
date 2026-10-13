# Fable 5 — Konzeptstudie

Interaktive One-Page-Website über Fable 5 von Anthropic. Keine offizielle Seite.

**Konzept: „Ein Buch aus Licht“.** Die Seite ist wie eine Fabel aufgebaut – Prolog, vier Kapitel
(Zuhören, Nachdenken, Handeln, Erzählen), Werkstatt, Haltung, Epilog. Papier, Tinte und Ton als
Farbwelt; ein Partikelfeld aus „Tinte“ (Three.js, eigener Shader) morpht pro Kapitel in eine neue
Form: Kugel → Buch → Knoten → Gitter → Möbiusband → Ring. Im Epilog wird die Seite Nacht und die
Tinte zu Licht.

- Three.js (Shader-Partikel, Maus-Interaktion), GSAP + ScrollTrigger (Choreografie, horizontales
  Kapitel-Scrolling), Lenis (Smooth Scroll)
- Bibliotheken liegen in `vendor/`, die Seite läuft ohne Build-Schritt
- Werkstatt-Demo nutzt vorbereitete Texte (`js/fables.js`), kein Live-Modell
- Respektiert `prefers-reduced-motion`, fällt ohne WebGL auf eine reine Textseite zurück

## Lokal starten

```sh
cd fable-5
python3 -m http.server 8000
# http://localhost:8000
```
(ES-Module brauchen einen lokalen Server, `file://` funktioniert nicht.)
