---
'druxt': patch
---

fix(#781): `getCollection` now returns fully hydrated resources in `included`
on a cache hit, matching what a fresh fetch returns, where it previously
returned bare `{ id, type }` references. A resource removed with
`flushResource` is fetched again on the next collection request instead of
coming back as an undefined entry, and a cached collection returns only the
includes its most recent response carried.
