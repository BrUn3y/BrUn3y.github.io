# Website maintenance agent

Read and follow [AGENTS.md](AGENTS.md) before updating the website. It contains the complete instructions for refreshing GitHub information, updating the Strava training log, preserving the Y2K design, validating the result, and publishing to https://brun3y.github.io/ from the private publishing repository.

These guides are available in the root of both repositories. Make changes in the canonical source repository, [BrUn3y/Brun3y](https://github.com/BrUn3y/Brun3y), on `master`; its workflow automatically copies the website and both guides to `BrUn3y/BrUn3y.github.io` on `main`. Direct edits to the publishing repository are overwritten by the next publication.

Never upload, commit, push, or publish credentials, passwords, access or refresh tokens, API secrets, private keys, credential files, or `.env` files containing secrets, even to a private repository. Keep secrets in GitHub Actions secrets or local environment variables, and follow the credential-handling rules in [AGENTS.md](AGENTS.md).
