# authed
Node TypeScript implementation of [authed.](https://github.com/authed-dev/authed)

![Vitest](https://github.com/HillwoodPark/authed/actions/workflows/vitest.yml/badge.svg)

This implementation is both an experiment and a work-in-progress, the intent of which is to evaluate Authed for use in [Epic Road Trip Planner](https://epicroadtripplanner.com).


## TODO:

### Anytime:
- Determine if method should be used in verify_request/verifyRequest (it's passed in -- but it's not used, and presumably is encapsulated by the token in the auth header)
- Remove per-run key generation from tests (hard-coded keys in the code are fine for this - but scary-looking and freak out the static analysis tools)
- Document (and enforce) that Node 21 or newer is required for the fetch API, and/or add Axios
- Create (or better - adopt) some Error "shape" convention, for error handling (e.g. AuthenticationError, RegistryError, etc.)
- CAREFULLY DRY up some tests, specifically by adding some reusable fixtures (e.g. GetTokenParams)

### After integration testing:
- Determine whether the nonce format is correct and compatible with the server and consistent with the Python implementation
- Determine whether we can replace the UUID strings with a UUID library, or add some parameter checking to ensure the strings we are getting are UUIDs in the expected format
- extract TokenCache into a standalone class

