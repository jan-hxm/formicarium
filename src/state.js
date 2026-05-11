'use strict';

// Single shared object so every module reads and mutates the same references
export const sim = {
  nest: null,
  queen: null,
  ants: [],
  food: [],
  particles: [],
  stats: { stored: 0, born: 0 },
  foodAccum: 0,
};
