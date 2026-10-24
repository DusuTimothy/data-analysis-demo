/**
 * Shared context object. Kept separate so the provider module only exports a
 * component, which keeps Fast Refresh clean.
 */

import { createContext } from 'react';

export const CampaignContext = createContext(null);
