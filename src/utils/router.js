// ==========================================================================
// Two Meridian — Router: Client-Side Router & Dynamic SEO Metadata Engine
// ==========================================================================

export const ROUTES = {
  world: {
    path: '/world',
    aliases: ['/', '/explore', '/index.html'],
    page: 'world',
    mode: 'casual',
    title: 'Two Meridian: Name Every Country | Free Geography Quiz & Map Game',
    description: 'Can you name all 196 countries? Two Meridian is a free geography game with an interactive map, timed speed runs, daily leaderboards, capitals & flags quizzes.',
    keywords: 'geography game, country quiz, map quiz, name all countries, world geography, 196 countries, interactive map'
  },
  flags: {
    path: '/flags-quiz',
    aliases: ['/flags'],
    page: 'flags',
    mode: 'casual',
    title: 'World Flags Quiz Game — Test Your Flag Knowledge | Two Meridian',
    description: 'Can you recognize all 196 world flags? Play the free interactive world flags quiz game on Two Meridian. Identify flags, test your speed, and chart your mastery.',
    keywords: 'world flags quiz, flag quiz game, guess the flag, national flags quiz, 196 flags'
  },
  capitals: {
    path: '/capitals-quiz',
    aliases: ['/capitals'],
    page: 'capitals',
    mode: 'casual',
    title: 'World Capitals Quiz — Master All 196 Capital Cities | Two Meridian',
    description: 'Master the capital cities of all 196 countries with Two Meridian\'s interactive capitals quiz. Test your speed, track continent accuracy, and view rich trivia.',
    keywords: 'world capitals quiz, capital cities game, guess the capital, 196 capitals quiz'
  },
  speed: {
    path: '/speed-run',
    aliases: ['/speed'],
    page: 'world',
    mode: 'speed',
    title: 'Speed Run Geography Quiz — 196 Countries Timed Sprint | Two Meridian',
    description: 'Race against the chronometer to name all 196 world countries as fast as possible in Two Meridian\'s Speed Run mode. Compete on daily global leaderboards!',
    keywords: 'speed run geography, timed country quiz, fast map quiz, 196 countries sprint'
  },
  reverse: {
    path: '/reverse-quiz',
    aliases: ['/reverse'],
    page: 'world',
    mode: 'reverse',
    title: 'Guess the Country on the Map — Reverse Geography Quiz | Two Meridian',
    description: 'Look at the highlighted country on the map and name it! Play the free reverse map deduction quiz on Two Meridian and test your visual location memory.',
    keywords: 'reverse map quiz, guess country on map, locate country quiz, map deduction game'
  },
  weakspots: {
    path: '/weakspots-quiz',
    aliases: ['/weakspots'],
    page: 'world',
    mode: 'weakspots',
    title: 'Weak Spots Geography Quiz — Practice Missed Countries | Two Meridian',
    description: 'Drill and master your weakest geographic areas. Two Meridian\'s Weak Spots mode replays only the countries you\'ve missed or skipped in past runs.',
    keywords: 'geography weak spots, practice missed countries, geography study quiz'
  },
  stats: {
    path: '/stats',
    aliases: [],
    page: 'stats',
    mode: 'casual',
    title: 'Expedition Stats & Field Logbook | Two Meridian',
    description: 'Review your cartographic logbook, expedition accuracy, mode best times, and continent mastery breakdowns on Two Meridian.',
    keywords: 'geography stats, atlas logbook, country progress tracking'
  },
  donate: {
    path: '/donate',
    aliases: ['/support'],
    page: 'donate',
    mode: 'casual',
    title: 'Support Two Meridian | Cartographer\'s Expedition Guild',
    description: 'Support the development of Two Meridian. Keep the atlas free, open-access, and ad-free for geography enthusiasts worldwide.',
    keywords: 'support two meridian, donate geography game, ad-free geography'
  }
};

export class Router {
  constructor(app) {
    this.app = app;
    this.currentRouteKey = 'world';
    
    // Listen to browser Back / Forward buttons
    window.addEventListener('popstate', (e) => {
      this._handleLocation(window.location.pathname, false);
    });
  }

  getRouteByPath(pathname) {
    // Normalize path
    const path = (pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
    
    // Search exact path match or alias match
    for (const [key, route] of Object.entries(ROUTES)) {
      if (route.path.toLowerCase() === path || route.aliases.includes(path)) {
        return { key, route };
      }
    }

    // Check query params or hash fallbacks (e.g. ?route=/flags-quiz or #flags-quiz)
    const urlParams = new URLSearchParams(window.location.search);
    const routeQuery = urlParams.get('route') || window.location.hash.replace('#', '');
    if (routeQuery) {
      const qPath = ('/' + routeQuery).toLowerCase().replace('//', '/');
      for (const [key, route] of Object.entries(ROUTES)) {
        if (route.path.toLowerCase() === qPath || route.aliases.includes(qPath) || key === routeQuery) {
          return { key, route };
        }
      }
    }

    return { key: 'world', route: ROUTES.world };
  }

  navigate(routeKey, pushState = true) {
    const item = ROUTES[routeKey] || ROUTES.world;
    this.currentRouteKey = routeKey;

    if (pushState && window.location.pathname !== item.path) {
      window.history.pushState({ routeKey }, item.title, item.path);
    }

    // Update <head> SEO Metadata
    this.updateHeadMetadata(item);

    // Update App Navigation & Page state
    if (this.app.navigation) {
      this.app.navigation.renderRoute(item.page, item.mode);
    }

    // Track page view in GA
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: item.title,
        page_location: `https://twomeridian.in${item.path}`
      });
    }
  }

  updateHeadMetadata(route) {
    document.title = route.title;

    // Meta Description
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', route.description);

    // Meta Keywords
    const keyMeta = document.querySelector('meta[name="keywords"]');
    if (keyMeta) keyMeta.setAttribute('content', route.keywords);

    // OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', route.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', route.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', `https://twomeridian.in${route.path}`);

    // Twitter Card
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', route.title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', route.description);

    // Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://twomeridian.in${route.path === '/world' ? '/' : route.path}`);
  }

  _handleLocation(pathname, pushState = false) {
    const { key } = this.getRouteByPath(pathname);
    this.navigate(key, pushState);
  }

  handleInitialRoute() {
    this._handleLocation(window.location.pathname, false);
  }
}
