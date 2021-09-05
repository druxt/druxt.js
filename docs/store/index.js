export const actions = {
  async nuxtServerInit({ commit }, { $content }) {
    try {
      // Add Druxt modules to Vuex store.
      const modulesIndex = await $content("api/README").only("toc").fetch()
      const modules = await Promise.all(modulesIndex.toc
        .filter((o) => o.id !== 'druxt')
        .map((o) =>
          $content(`modules/${o.id.split("-")[1]}/README`)
            .only(["description", "dir", "title"])
            .fetch()
        )
      )
      commit("setModules", modules);

      // Add Modules menu children to the vuex store.
      const moduleChildren = modules
        .map((o) => ({
          component: "NuxtLink",
          text: o.title,
          props: { to: o.dir },
        }));
      commit("addMenuChildren", { children: moduleChildren, parent: "/modules" });

      // Add Guide menu children to the vuex store.
      const guideIndex = await $content("guide")
        .sortBy("weight")
        .only(["path", "title", "weight"])
        .fetch();
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
