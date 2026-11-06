Feature: Navigation projects authentic events into side-local display actions

  Scenario: missing
    Given authentic recordings with overlapping base and head event IDs
    When the requested display or reference has missing
    Then the producer refuses invalid projection

  Scenario: foreign
    Given authentic recordings with overlapping base and head event IDs
    When the requested display or reference has foreign
    Then the producer refuses invalid projection

  Scenario: ambiguous
    Given authentic recordings with overlapping base and head event IDs
    When the requested display or reference has ambiguous
    Then the producer refuses invalid projection

  Scenario: unsupported-kind
    Given authentic recordings with overlapping base and head event IDs
    When the requested display or reference has unsupported-kind
    Then the producer refuses invalid projection

  Scenario: existing-wrong-target
    Given authentic recordings with overlapping base and head event IDs
    When the requested display or reference has existing-wrong-target
    Then the producer refuses invalid projection

