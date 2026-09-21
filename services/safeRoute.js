// to avoid: /user/signin?returnTo=https: //evil.com
function isSafeRoute(route) {
  return (
    typeof route === "string" &&
    route.startsWith("/") && 
    !route.startsWith("//")
  );
}

module.exports = {
  isSafeRoute,
}