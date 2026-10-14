---
name: Account confirmation scope
description: User's chosen scope for six-digit email confirmation.
---

Confirm email when creating an account using a six-digit code instead of a confirmation link. Ordinary login remains email and password; the request is not passwordless login or an extra verification step on every login.

**Why:** The user explicitly selected confirmation when creating an account rather than either every-login alternative.

**How to apply:** Preserve this distinction in account flows and hosted email templates. A template in the repository is not evidence that the hosted provider sends codes; verify the hosted configuration and actual delivery separately.

Treat the hosted dashboard's configuration restrictions as authoritative rather than assuming that general provider documentation lists all prerequisites.

**Why:** The user's Supabase dashboard blocked editing the confirmation template until Custom SMTP was configured, although the general template documentation described editing without emphasizing that prerequisite.

**How to apply:** Check prerequisites before asking the user to edit hosted templates. Do not mistake this restriction for a required paid Supabase upgrade or work around it by disabling email confirmation.

The project team has an email account but no owned domain.

**Why:** The user explicitly stated this when choosing how to send verification emails.

**How to apply:** Do not assume access to domain verification or DNS settings when recommending a mail service. Distinguish a limited testing setup from a release-ready sender.
