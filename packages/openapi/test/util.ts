import { readFileSync } from 'fs';
import { buildAppMap, Event } from '@appland/models';

// POST https://api.stripe.com/v1/tokens
// GET https://api.stripe.com/v1/customers
// POST https://api.stripe.com/v1/customers/cus_JnA0JVDwH8BjTl
// POST https://api.stripe.com/v1/charges
const clientAppMap = buildAppMap()
  .source(
    readFileSync(
      'test/data/PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
    ).toString()
  )
  .normalize()
  .build();
const httpClientRequests = clientAppMap.events.filter(
  (e: Event) => !!e.httpClientRequest
);

// POST /api/mapsets
const serverAppMap = buildAppMap()
  .source(
    readFileSync(
      'test/data/POST_api_mapsets_logged_in_as_a_member_of_the_app_organization_with_one_scenario_with_bare_app_name_creates_a_mapset_with_a_scenario.appmap.json'
    ).toString()
  )
  .normalize()
  .build();
const httpServerRequests = serverAppMap.events.filter(
  (e: Event) => !!e.httpServerRequest
);

export { clientAppMap, httpClientRequests, serverAppMap, httpServerRequests };
