const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080, // 明确指定Vue开发服务器端口
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "",
        },
        logLevel: "debug", // 添加日志以便调试
      },
    },
  },
});
