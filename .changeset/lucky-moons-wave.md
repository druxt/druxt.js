---
'druxt': patch
---

fix(#781): re-hydrate included resources on getCollection cache hit

A cache hit now returns `included` as hydrated resources, the same shape a
fresh fetch returns. The hydration guards the resource type bucket, which
`flushResource` can empty while the collection entry survives, and
`addCollection` drops stored `included` refs when the incoming response
carries none, so a slot shared by queries that differ only by their includes
never returns resources the query did not ask for.
