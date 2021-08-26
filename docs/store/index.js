export const actions = {
  async nuxtServerInit ({ commit }, { $content }) {
    try {
      const index = await $content("guide").only(["title"]).fetch();
      const children = index.map((o) => ({
        component: "NuxtLink",
        text: o.title,
        props: { to: o.path },
      }));
      commit("addMenuChildren", { children, parent: "/guide" });
    } catch (err) {
      console.log(err)
    }
  }
}
