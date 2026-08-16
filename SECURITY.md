# Security Policy

## Supported versions

Only the latest published version on the npm registry is supported with
security fixes. Patch releases are cut via the automated
semantic-release pipeline (`feat:`/`fix:` commits on `main`), so keep the
package updated to receive fixes promptly.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via GitHub Security Advisories (private vulnerability
reporting):

https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/security/advisories

When filing a report, include:

- the affected package version and how it was obtained;
- a minimal reproduction (input file or code snippet);
- the impact you observed or suspect.

## What happens next

1. The maintainer acknowledges the report within 72 hours and triages it.
2. A fix is prepared on a private branch and released as a patch version
   through the normal release pipeline.
3. The fix ships with a changelog entry referencing the advisory; a
   GitHub Security Advisory is published once the fix is available, and
   the issue is disclosed publicly only after coordination.