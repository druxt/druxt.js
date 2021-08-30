export const actions = {
  async nuxtServerInit({ commit }, { $content }) {
    try {
      // Add Modules menu children to the vuex store.
      const moduleIndex = await $content("modules").sortBy("title").only(["path", "title"]).fetch();
      const modules = moduleIndex
        .filter((o) => !o.path.endsWith("/README"))
        .map((o) => ({
          component: "NuxtLink",
          text: o.title,
          props: { to: o.path },
        }));
      commit("addMenuChildren", { children: modules, parent: "/modules" });

      // Add Guide menu children to the vuex store.
      const guideIndex = await $content("guide").only(["path", "title"]).fetch();
      const guideChildren = guideIndex.map((o) => ({
        component: "NuxtLink",
        text: o.title,
        props: { to: o.path.replace("/README", "") },
      }));
      commit("addMenuChildren", { children: guideChildren, parent: "/guide" });

      // Add API menu children to the vuex store.
      const apiIndex = await $content("api").only(["path", "title"]).fetch();
      const apiChildren = apiIndex.map((o) => ({
        component: "NuxtLink",
        text: o.title,
        props: { to: o.path.replace("/README", "") },
      }));
      commit("addMenuChildren", { children: apiChildren, parent: "/api" });

    } catch (err) {
      console.log(err)
    }
  }
}
