Feature: Behavioral comparison is independent of sequence presentation
  Loop grouping is a display choice, not a behavioral control-flow event.
  Canonical changes use raw calls; references navigate the requested display.

  Scenario: return-change
    Given the return-change recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: truncated-sql
    Given the truncated-sql recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 query-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: repetition
    Given the repetition recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-added changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: nested-repetition
    Given the nested-repetition recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-added changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: insert-before
    Given the insert-before recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-added changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: insert-after
    Given the insert-after recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-added changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: ordinary-sql-literal
    Given the ordinary-sql-literal recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 0 none changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: shared-target
    Given the shared-target recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 2 call-added changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: reparent
    Given the reparent recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: repeated-sql-literal
    Given the repeated-sql-literal recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 0 none changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: rpc-server-status
    Given the rpc-server-status recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 rpc-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: rpc-client-route
    Given the rpc-client-route recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 rpc-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: labels-and-timing
    Given the labels-and-timing recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 0 none changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion

  Scenario: query-parent-reparent
    Given the query-parent-reparent recordings
    When compared with grouping omitted, true and false
    Then canonical changes and IDs are invariant
    And exactly 1 call-changed changes describe the behavior
    And navigation retains authentic event subsets on the requested display
    And the overlay contains expanded semantic calls
    And change IDs repeat and survive event renumbering and unrelated earlier insertion
