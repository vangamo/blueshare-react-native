# Spec Delta

## MODIFIED Requirements

### Requirement: Creation box opens at the top of the Timeline
When the create button is pressed on Timeline, the app SHALL show the creation box as the first element of the Timeline feed, above every item, in its choose step with no type selected. If the feed is scrolled down, it SHALL scroll to the top so the box is visible.

#### Scenario: Opening the box
- **WHEN** the user taps the create button on Timeline
- **THEN** the creation box appears above the first timeline item, showing "Crear nuevo elemento:", the type select with "Selecciona una opción", and the "Cancelar" and "Guardar" buttons

#### Scenario: Opening while scrolled down
- **WHEN** the user has scrolled the Timeline down and taps the create button
- **THEN** the feed scrolls to the top and the creation box is fully visible below the header

#### Scenario: Opening while scrolled down in landscape
- **WHEN** the user has scrolled the Timeline down in a landscape layout and taps the create button
- **THEN** the feed scrolls to the top and the creation box starts fully visible below the tab bar, not under it
