# Website maintenance agent

Read and follow [AGENTS.md](AGENTS.md) before updating the website. It contains the complete instructions for refreshing GitHub information, updating the Strava training log, preserving the Y2K design, validating the result, and publishing to https://brun3y.github.io/ from the private publishing repository.

This repository, [BrUn3y/BrUn3y.github.io](https://github.com/BrUn3y/BrUn3y.github.io), is the canonical website repository. Make website and maintenance changes here on `main`. Do not add website files or workflows to the separate public profile repository, `BrUn3y/Brun3y`. The website reads its already-public profile and Strava statistics without modifying that repository.

Never upload, commit, push, or publish credentials, passwords, access or refresh tokens, API secrets, private keys, credential files, or `.env` files containing secrets, even to a private repository. Keep secrets in GitHub Actions secrets or local environment variables, and follow the credential-handling rules in [AGENTS.md](AGENTS.md).
