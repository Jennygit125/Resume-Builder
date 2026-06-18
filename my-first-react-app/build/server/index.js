import "node:stream";
import "@react-router/node";
import "react-router";
import "isbot";
import "react-dom/server";
import "react/jsx-runtime";
import "react";
import "@vercel/speed-insights/react";
import "@supabase/supabase-js";
//#endregion
//#region src/utils/api.js
var supabaseUrl = "".trim().replace(/\/$/, "");
if (supabaseUrl === "" || !supabaseUrl.startsWith("http")) {
	console.error("Supabase Error: VITE_SUPABASE_URL is missing or invalid (must start with http).");
	throw new Error("Supabase client initialization failed: Missing or invalid VITE_SUPABASE_URL.");
}
console.error("Supabase Error: VITE_SUPABASE_ANON_KEY is missing or invalid.");
throw new Error("Supabase client initialization failed: Missing or invalid VITE_SUPABASE_ANON_KEY.");
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
var server_manifest_default, assetsBuildDirectory, basename, future, ssr, isSpaMode, prerender, routeDiscovery, publicPath, entry, routes, allowedActionOrigins;
