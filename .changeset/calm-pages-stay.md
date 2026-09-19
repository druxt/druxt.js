---
'druxt': patch
---

Druxt components now keep their rendered content while they fetch again. Before, a component with a default slot and no wrapper component went blank during a refetch, which made the page jump after it loaded.
