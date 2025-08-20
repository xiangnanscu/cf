import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import { Model } from "~/globals";
import { BaseField } from "~/lib/model/fields.mjs";
import { request } from "~/lib/Http";
import useAuth, { updateSession } from "~/composables/useAuth";
import { isMPWebview, decodeBase64 } from "~/lib/utils";

Model.request = request;
BaseField.request = request;

const { login, loginFromSessionData } = useAuth();
const configAuth = async () => {
  const query = window.location.href.split("?", 2)[1];
  const urlParams = new URLSearchParams(query);

  const sessionDataParam = urlParams.get("session_data");
  if (sessionDataParam) {
    try {
      const decodedSessionData = JSON.parse(decodeBase64(sessionDataParam));
      loginFromSessionData(decodedSessionData);
      return "mp";
    } catch (error) {
      await updateSession();
      return "web";
    }
  }
};

configAuth().then((env) => {
  const app = createApp(App);
  app.use(router);
  // console.log("main.js ENV: ", import.meta.env.MODE, process.env.NODE_ENV);
  app.mount("#app");
  app.config.errorHandler = (error, instance, info) => {
    console.error("全局错误捕获：", error, env);
    if (typeof error == "object") {
      if (error.name == "AxiosError") {
        const { data, status, request } = error.response;
        // console.log("AxiosError:", { data, status, request });
        if (status == 403) {
          const [_, url] = request.responseURL.match(/https?:\/\/[^/]+(.+)/);
          const realUrl =
            import.meta.env.MODE === "production"
              ? url
              : url.slice(process.env.VITE_PROXY_PREFIX.length);
          console.error("需要登录");
          return router.push({
            name: "UserLogin",
            query: {
              redirect: router.currentRoute.value.fullPath,
            },
          });
        } else if (error.response.data) {
          return Notice.error(error.response.data);
        }
      } else if (error.name == "PermissionError") {
        return router.push({
          name: isMPWebview() ? "403" : "UserLogin",
          // name: "UserLogin",
          query: {
            redirect: router.currentRoute.value.fullPath,
          },
        });
      } else if (error.name == "WeixinEnvError") {
        return router.push("/wx-auth-error");
      } else if (error.message !== "") {
        // Http.post抛出的错误是空字符串,暂时不展示
        return Notice.error(error.message);
      }
    } else {
      Notice.error(error);
    }
  };
});
