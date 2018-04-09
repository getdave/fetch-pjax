# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2018-04-09

### Added
* Support for internal links with hash anchors (eg: `<a href="#internal-link">`) - including scroll restoration
* Ability to opt out of handling forms with PJAX
* Handling forms with `POST` or `GET` methods
* Handling form `enctype` - can choose to send as `enctype="multipart/form-data"` if required
* Ability to designate elements/forms to be ignore/excluded from PJAX handling

### Changed
* Cross origin links are now correctly excluded from PJAX - in future this will be configurable

### Fixed
* Invalid construction of form query string - previous was ommitting connecting `&`
* Bugs surrounding `popstate` - difficult to isolate
* Edge case where uncessary PJAX requests were fired for requests to the same `pathname`

## [1.0.0] - 2018-03-29

Initial release.
