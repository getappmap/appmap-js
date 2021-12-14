import { Metadata } from '@appland/models';

export type FindingStatusListItem = {
  app_id: string;
  identity_hash: string;
  status: string;
};

export type AppMapListItem = {
  scenario_uuid: string;
  metadata: Metadata;
};
