/**
 * Features that exist in code but are turned off in the UI.
 * Set to true to re-enable with no other changes.
 */
export const FEATURES = {
  /**
   * Global sections (one section shared across pages). Off until we fix:
   * turning the flag off does not split pages, and auto-republish would
   * put other pages' drafts live. Site header and footer use the same
   * mechanism and stay enabled.
   */
  globalSections: false,
} as const;
