# Spec Delta

## MODIFIED Requirements

### Requirement: Avatar
The header SHALL show a 42×42 circular avatar with a 2-point strong-ink border. It SHALL show the saved profile photo filling the circle, or the avatar background color and a centered `👵` emoji when there is none. It SHALL be a button, announced to assistive technologies with the label "Profile", with a touch target of at least 44×44 points. Tapping it SHALL open the profile dialog (see the user-profile capability).

#### Scenario: Avatar display
- **WHEN** the header is shown and the profile has no photo
- **THEN** the avatar circle shows the `👵` emoji centered

#### Scenario: Avatar with a photo
- **WHEN** the header is shown and the profile has a saved photo
- **THEN** the avatar circle shows the photo, cropped to the circle, inside its border

#### Scenario: Tapping the avatar
- **WHEN** the user taps the avatar on any section
- **THEN** the button shows press feedback and the profile dialog opens

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the avatar
- **THEN** it is announced as a button named "Profile"

### Requirement: Accessible touch targets
Every interactive control in the shell SHALL have a touch target of at least 44×44 points. The one exception is the title field: it follows the 42-point height of the design and is much wider than 44 points.

#### Scenario: Footer and header buttons
- **WHEN** the touch targets of the menu button, the avatar, the footer buttons and the create button are measured
- **THEN** each is at least 44 points wide and 44 points tall
