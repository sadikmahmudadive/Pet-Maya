// Stand-in for the "re2js" package (see vite.config.js). Only Firestore's pipeline regex expressions call it.
export const RE2JS = {
  compile() {
    throw new Error('Firestore pipeline regex expressions are not bundled in this build.');
  },
};
export default RE2JS;
