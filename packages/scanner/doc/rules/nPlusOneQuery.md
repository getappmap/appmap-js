---
id: n-plus-one-query
name: N plus one query
title: N plus 1 SQL query
references:
  CWE-1073: https://cwe.mitre.org/data/definitions/1073.html
impactDomain: Performance
---


Finds occurrances of a query being repeated within a loop.

### Rule logic

Within each command, SQL queries are normalized, grouped, and counted.

If the number of duplicate instances of a normalized query exceeds the threshold, it's reported as a
finding.

### Notes

N plus one queries typically occur when a
[data access object (DAO)](https://en.wikipedia.org/wiki/Data_access_object) has a one-to-many or
many-to-many relationship, and the relationship is enumerated within a loop. The DAO will issue a
separate query to fetch each related record. If the number of related objects is large, or if each
one is fairly expensive to fetch, application performance suffers.

### Resolution

DAO libraries typically offer a feature called "eager loading". For example:

- [ActiveRecord](https://news.learnenough.com/eager-loading)
- [Django ORM](https://docs.djangoproject.com/en/4.0/topics/db/optimization/#retrieve-everything-at-once-if-you-know-you-will-need-it)
- [Hibernate](https://docs.jboss.org/hibernate/orm/5.3/javadocs/org/hibernate/jpamodelgen/xml/jaxb/FetchType.html)

Enable eager loading on the association in question to fetch the data efficiently, without repeated,
identical queries.

### Options

- `warningLimit` Threshold for reporting a warning. Default: 5.
- `errorLimit` Threshold for reporting an error. Default: 10.

### Examples

```yaml
- rule: nPlusOneQuery
  parameters:
    warningLimit: 5
    errorLimit: 10
```
