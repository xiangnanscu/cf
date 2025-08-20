import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from 'vue-router/auto-routes'


const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});
router.beforeEach(async (to, from) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  const store = useStore();
  if (to.name) {
    store.siderKeys = [to.name];
    store.headerRightKeys = [to.name];
    store.headerLeftKeys = [to.name];
  }
  if (
    to.meta.adminRequired &&
    to.name !== "AdminUserLogin" &&
    store.session?.user?.permission !== Number(process.env.GOD_PERMISSION)
  ) {
    // redirect the user to the login page
    return {
      name: "AdminUserLogin",
      query: { redirect: encodeURIComponent(to.fullPath) },
    };
  } else if (
    to.meta.loginRequired &&
    to.name !== "UserLogin" &&
    !store.session?.user?.id
  ) {
    // redirect the user to the login page
    return {
      name: "UserLogin",
      query: { redirect: encodeURIComponent(to.fullPath) },
    };
  }
});
export default router;
