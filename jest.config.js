/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm", // Utilise le preset spécifique ESM
  testEnvironment: "node",
  testTimeout: 30000,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    // C'est ici qu'on gère tes imports qui finissent en .js
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // On dit à ts-jest de traiter les fichiers .ts
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
