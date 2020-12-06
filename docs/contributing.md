
# Fetch Feed: Contribution Guide

We welcome contributions to Fetch Feed. This guide outlines what's expected of you when you contribute, and what you can expect from me.

## Table of Contents

  * [What I expect from you](#what-i-expect-from-you)
  * [What you can expect from me](#what-you-can-expect-from-me)
  * [Technical](#technical)
    * [Linting](#linting)
    * [Unit tests](#unit-tests)
    * [Integration tests](#integration-tests)
    * [Manual testing](#integration-tests)


## What I expect from you

If you're going to contribute to Fetch Feed, thanks! I have a few expectations of contributors:

  1. [Follow the code of conduct](code_of_conduct.md)
  2. [Follow the technical contribution guidelines](#technical)
  3. Be respectful of the time and energy that me and other contributors offer


## What you can expect from me

If you're a contributor to Fetch Feed, you can expect the following from me:

  1. I will enforce [Fetch Feed's code of conduct](code_of_conduct.md)
  2. If I decide not to implement a feature or accept a PR, I will explain why

Contributing to Fetch Feed **does not**:

  1. Guarantee you my (or any other contributor's) attention or time – I work on this in my free time and I make no promises about how quickly somebody will get back to you on a PR, Issue, or general query
  2. Mean your contribution will be accepted


## Technical

To contribute to Fetch Feed's code, clone this repo locally and commit your work on a separate branch. Open a pull-request to get your changes merged. If you're doing any large feature work, please make sure to have a discussion in an issue first – I'd rather not waste your time if it's not a feature I want to add to Fetch Feed 🙂

I don't offer any guarantees on how long it will take me to review a PR or respond to an issue, [as outlined here](#what-you-can-expect-from-me).

### Linting

Fetch Feed is linted using [ESLint](https://eslint.org/), configured in the way I normally write JavaScript. Please keep to the existing style.

ESLint errors will fail the build on any PRs. Most editors have an ESLint plugin which will pick up errors, but you can also run the linter manually with the following command:

```
make verify
```

### Unit tests

Fetch Feed has a suite of unit tests. Failing unit tests will fail the build on any PRs. You can run unit tests locally to check your work with the following command:

```
make test
```
