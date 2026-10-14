---
name: Account confirmation scope
description: User's chosen scope for six-digit email confirmation.
---

Confirm email when creating an account using a six-digit code instead of a confirmation link. Ordinary login remains email and password; the request is not passwordless login or an extra verification step on every login.

**Why:** The user explicitly selected confirmation when creating an account rather than either every-login alternative.

**How to apply:** Preserve this distinction in account flows and hosted email templates. A template in the repository is not evidence that the hosted provider sends codes; verify the hosted configuration and actual delivery separately.
