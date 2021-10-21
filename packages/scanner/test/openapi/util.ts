import { readFileSync } from 'fs';
import { buildAppMap, Event } from '@appland/models';

// POST https://api.stripe.com/v1/tokens
// GET https://api.stripe.com/v1/customers
// POST https://api.stripe.com/v1/customers/cus_JnA0JVDwH8BjTl
// POST https://api.stripe.com/v1/charges
const clientAppMap = buildAppMap()
  .source(
    readFileSync(
      'test/fixtures/appmaps/PaymentsController_create_no_user_email_on_file_makes_a_onetime_payment_with_no_user_but_associate_with_stripe.appmap.json'
    ).toString()
  )
  .normalize()
  .build();
const httpClientRequests = clientAppMap.events.filter((e: Event) => !!e.httpClientRequest);

export { clientAppMap, httpClientRequests };
