/**
 * Reads campaign identity and filter options from the shared provider.
 */

import { useContext } from 'react';
import { CampaignContext } from '../context/campaignContext.js';

export function useCampaign() {
  const value = useContext(CampaignContext);
  if (!value) {
    throw new Error('useCampaign must be used inside CampaignProvider.');
  }
  return value;
}
