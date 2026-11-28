---
'druxt': patch
---

fix(#1016): `cache.maxSize` now limits each cache area as a whole. It limited each consumer's entries apart, so a site whose requests send several `X-Consumer-ID` values could hold a multiple of the size it set.

A site with one consumer sees no change. A site with several shares the limit between them, the busiest getting the most room, so it may want a larger `cache.maxSize` to keep its hit rate. An area keeps at most 32 consumers, dropping the least recently used.
