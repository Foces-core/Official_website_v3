# FOCES Site Comparison (28 October 2026)

## Sources and limits

- [foces.org](http://foces.org/) serves an HTTP homepage with an About paragraph, a "Latest Works" gallery, and links to service, gallery, and contact pages. Its HTTPS endpoint returned a certificate-name error during this review. The gallery labels ("Dew Drop", "Bottle Mockup", and similar) appear to be template content, not verified student projects.
- [foces-cec.web.app](https://foces-cec.web.app/) lists orientation classes, talks, workshops, student projects, four benefits (peer learning, collaboration, networking, skills), named past events, a join link, and contact details.
- [foces.ceconline.edu](https://foces.ceconline.edu/) already has About, Featuring, Events, Execom, and Contact sections, an `/events` route, a join CTA, and Instagram and email links. Do not duplicate these.

## Suggested additions

1. Add a concise "What members do" section with real programs and outcomes: workshops, peer learning, project collaboration, and networking. The current About section describes the mission but does not break these activities into scan-friendly choices. Source: [foces-cec.web.app](https://foces-cec.web.app/#services); current [About section](https://foces.ceconline.edu/#about). Validate any counts before publishing them.
2. As the list grows, add year/category filters or clearer past/upcoming grouping to `/events`, with recordings or materials when available. The current page already has dated event cards, photo galleries, and some past-event links; older labels such as PyCEC, Session on Git, FYPM, and Clash Of Coders need date and rights verification before reuse. Sources: [past events](https://foces-cec.web.app/#works); current [events page](https://foces.ceconline.edu/events).
3. Showcase verified student projects with credits and working demo/source links if members opt in. The older site says the forum coordinates student projects, but `foces.org`'s gallery contains apparent stock-template entries; do not migrate those. Sources: [student projects](https://foces-cec.web.app/#intro), [older gallery](http://foces.org/); current [Featuring section](https://foces.ceconline.edu/#featuring).

The current site is the strongest production baseline. Reuse historical content only after ownership, dates, and links are verified.
