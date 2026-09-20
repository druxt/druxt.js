---
'druxt': patch
---

Druxt components now keep their rendered content while they fetch again. Before, a component with a default slot and no wrapper component went blank during a refetch, which made the page jump after it loaded. A failed fetch with no component data of its own no longer throws while the component fetches again.
