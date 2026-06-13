import type { Config } from "@react-router/dev/config";

export default {
  // Since your files are in 'src' instead of the default 'app' folder
  appDirectory: "src",
  ssr: false,
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;