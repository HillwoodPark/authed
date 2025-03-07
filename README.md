# authed - EXPERIMENTAL - NOT FOR PRODUCTION USE
Experimental Work-In-Progess Node TypeScript evaluation implementation of [authed.](https://github.com/authed-dev/authed)

![Vitest](https://github.com/HillwoodPark/authed/actions/workflows/vitest.yml/badge.svg)

**This implementation is both experimental and a work-in-progress (WIP)**, the intent of which is to evaluate `authed` for potential use in [Epic Road Trip Planner](https://epicroadtripplanner.com). **Do not use it in production environments**. In the mean time, we've made this repository and package public with the hope that others can use it as a reference or starting point for their own implementation of `authed` for Nodejs or other JavaScript platforms.

**If you HAVE an existing JavaScript implementation, or are building one, [please reach out to us.](https://hillwoodpark.com/contact)** We'd certainly love to hear about it, and possibly collaborate.

Even more importantly, if you're using `authed` with your own agent, whether that's the original Python SDK, your own implementation, or this implementation **[please reach out and let us know.](https://hillwoodpark.com/contact)** Having our own AI agents talk to each other is a fine starting point for this evaluation, but the use cases we'd ***REALLY*** like to evaluate are whether our Epic Road Trip Planner Agent could book a hotel or a campground or a dinner reservation for our users with YOUR Agents, securely, privately, and with minimal end user interaction. SO - PLEASE LET US KNOW!

## Dependencies
- Node.js >= v22.12.0 - this code uses Fetch API, which was available in earlier versions of Node, but has not been tested with any version prior to v22.12.

## TODO:

### Any time:
- Add a CLI
- Add Installation section to this README (and indicate we've only used npm, and not pnpm or yarn, and definitely not in the browser)
- Create a GitHub action to publish
- Remove per-run key generation from tests
    
    Hard-coded keys in the code would actually be OK for this - BUT that's a really bad habit, and they're genuinely scary-looking and freak out static analysis tools. Once we have a CLI perhaps the CLI tool can gen some up in a temp directory as part of the test run.

- Create (or better - adopt) some Error "shape" convention, for error handling (e.g. AuthenticationError, RegistryError, etc.)
- CAREFULLY DRY up some tests, specifically by adding some reusable fixtures (e.g. GetTokenParams)
- Figure out how to package examples

### After some integration testing:
- Determine whether we can replace the UUID strings with a UUID library, or add some parameter checking to ensure the strings we are getting are UUIDs in the expected format
- extract TokenCache into a standalone class

