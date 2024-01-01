# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2024-01-01

### Added

- parseZodSchema

When executing sync, the program was parsing a schema that already existed. At that time, if there was a comment-out in the statement to be parsed, the parsing failed. The function was replaced with one using PEG.js.

- Initial release
