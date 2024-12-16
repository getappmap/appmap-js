---
layout: docs
title: Docs - Reference
description: "Complete guide to managing AppMap subscriptions, including how to subscribe, manage users, and unsubscribe for personal, team, and enterprise licenses."
toc: true
reference: true
step: 19
name: Subscription Management
---

# Subscription Management

This guide explains how to manage your AppMap subscription throughout its lifecycle, from initial setup through cancellation. The procedures differ based on your license type:

- **Pro:** Purchase through Stripe to activate your Personal subscription. For Team subscriptions, you'll manage an organization with 
   assistance from AppMap support.
- **Enterprise:** Managed through the AppMap sales team.

Terms of the Community, Pro, and Enterprise tiers are detailed on the [Pricing page](/pricing.html).

## Activating AppMap with a License Key

Before you subscribe, you'll obtain a license key. This is typically performed from within the AppMap extension for your code editor.
For more details, follow the [license key installation instructions](/docs/reference/license-key-install).

## Community Tier

Once you've activated AppMap with a license key, you'll have access to the Community tier. 

The Community tier is subject to limitations, such as the maximum number of Navie AI conversations you can have in a 7 day period.

## Pro Tier

1. Sign in to [getappmap.com](https://getappmap.com) using your email address. You'll be emailed a one-time login code.
2. Go to your Account Settings page and click "Subscribe".
3. You'll be redirected to a checkout page provided by Stripe.
4. Choose your plan (monthly or annual), number of licenses, and enter payment details.
5. Complete the Stripe checkout process.
6. You'll be redirected back to [getappmap.com](https://getappmap.com) when you've successfully subscribed.
7. You can now return to your code editor and start using AppMap Pro!

### Team Licenses

If you buy a license with multiple seats, other users can join your subscription through the use of an AppMap Organization.

You'll need to contact AppMap support at support@appmap.io to set up your organization. Your organization will be configured
with an domain extension that matches your company's email addresses. All users with email addresses that match the domain
will automatically be joined to your organization.

From the AppMap account settings page, you can manage your organization members. For example, if a team member leaves your organization, you can remove them from your organization.

### Managing Your Subscription

From your Account Settings page, you can access the Stripe billing portal to:

- Update your payment method
- Change the number of seats
- Switch between monthly and annual billing
- View invoices and payment history
- Update billing information

### Canceling Your Subscription

1. Access the Stripe billing portal from your Account Settings page
2. Navigate to "Subscription details"
3. Click "Cancel subscription"
4. Confirm cancellation
   - Service continues until end of current billing period

## Enterprise Tier

Enterprise subscriptions are managed in collaboration with the AppMap sales team. 
Contact AppMap sales to begin the enterprise subscription process:

- Email: [sales@appmap.io](mailto:sales@appmap.io)

Similar to the Pro subscription, you'll be set up with an AppMap Organization. Your users will auto-join to the organization based on their email domain, and you can manage your organization members from the AppMap account settings page.

## Disabling Navie AI Hosted Proxy

If you have a Pro or Enterprise subscription, you can disable the Navie AI hosted proxy for your organization. This setting will prevent
users in your organization from using the Navie AI hosted proxy. This setting is useful if you have a security policy that requires users
to use an approved LLM such as:

* GitHub Copilot
* An internally provided LLM proxy
* Organization-provided LLM API keys

## Troubleshooting

For all subscription-related issues, contact AppMap support at support@appmap.io

## Additional Resources

- [License Key Installation Guide](/docs/reference/license-key-install)
- [Terms and Conditions](/community/terms-and-conditions)
- [Privacy Policy](/community/privacy-policy)