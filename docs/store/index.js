export const actions = {
  async nuxtServerInit ({ commit }, { $content }) {
    try {
      // Add Guide menu children to the vuex store.
      const apiIndex = await $content("api").only(["path", "title"]).fetch();
      const apiChildren = apiIndex.map((o) => ({
        component: "NuxtLink",
        text: o.title,
        props: { to: o.path.replace("/README", "") },
      }));
      commit("addMenuChildren", { children: apiChildren, parent: "/api" });

      // Add Guide menu children to the vuex store.
      const guideIndex = await $content("guide").only(["path", "title"]).fetch();
      const guideChildren = guideIndex.map((o) => ({
        component: "NuxtLink",
        text: o.title,
        props: { to: o.path.replace("/README", "") },
      }));
      commit("addMenuChildren", { children: guideChildren, parent: "/guide" });
    } catch (err) {
      console.log(err)
    }
  }
}
