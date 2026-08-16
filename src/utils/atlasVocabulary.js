// ==========================================================================
// Two Meridian — Atlas Vocabulary: Cartographic copy & thematic text system
// ==========================================================================

export const ATLAS_VOCABULARY = {
  loading: [
    'Retrieving archives...',
    'Unfolding cartographic charts...',
    'Aligning compass meridians...',
    'Calibrating quadrant coordinates...',
    'Tracing continental boundaries...'
  ],
  empty: {
    leaderboard: 'No expeditions logged in the archives yet. Be the first cartographer to chart this realm!',
    stats: 'Your logbook is empty. Embark on an expedition to record your journey.',
    weakSpots: 'No weak spots recorded in your logbook! Miss or skip countries during expeditions to populate your drill list.',
    history: 'No past expeditions archived.'
  },
  errors: {
    network: 'Signal lost in the storm. Check your compass connection.',
    anomaly: 'Cartographic anomaly detected. Unable to record log entry.',
    unrecognized: 'Territory not recognized in this atlas edition.',
    alreadyDiscovered: 'Territory already charted on your map!'
  },
  fourOhFour: {
    title: 'Terra Incognita',
    subtitle: 'This territory doesn’t exist in our atlas. Perhaps it was renamed, or never charted to begin with.',
    badge: 'LOST COORDINATES • 404'
  },
  debriefQuotes: {
    perfect: 'Master Cartographer — The entire globe lies fully charted under your gaze!',
    master: 'Grand Navigator — A masterclass in world geography!',
    explorer: 'Veteran Explorer — Deep knowledge of the world’s distant shores.',
    apprentice: 'Cartographer’s Apprentice — Your journey across the continents has begun.',
    novice: 'Novice Voyager — Keep setting sail; new lands await discovery.'
  }
};

export function getRandomLoadingText() {
  const list = ATLAS_VOCABULARY.loading;
  return list[Math.floor(Math.random() * list.length)];
}
