interface RouteLocation {
  origin: string;
  pathname: string;
}

export function createHashRouteHref(location: RouteLocation, route: string) {
  const documentPath = location.pathname.endsWith("/")
    ? location.pathname
    : `${location.pathname}/`;
  const hashRoute = route.startsWith("/") ? route : `/${route}`;

  return `${location.origin}${documentPath}#${hashRoute}`;
}
