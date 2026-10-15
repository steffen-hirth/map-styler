// Build stage. The staging build (VITE_STAGE=staging, served under /staging/)
// keeps its own browser storage so trying things there never touches the
// live editor's saved work.

export const STAGE: 'production' | 'staging' = import.meta.env.VITE_STAGE === 'staging' ? 'staging' : 'production';

export const storageKey = (name: string) => `${STAGE === 'staging' ? 'mapstyler-staging' : 'mapstyler'}:${name}`;
