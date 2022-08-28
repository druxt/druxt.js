Feature: Homepage

  Scenario: Anonymous user visits the homepage
    Given I visit the homepage
    Then I see "#__nuxt" element
