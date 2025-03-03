# SCOPING NOTE

## Project definition

The OrbitComms project is a real-time channel-based communication system.
It is composed of two main parts : VOIP and regular Channels.
VOIP is a proximity voice chat that reads In-Game 3D positions to simulate real-life voice chat.
Channels are chat rooms assigned to users by administrators. They are designed to allow a user to communicate with several groups of people at the same time.
Channels may be normal or priority. Priority channels are designed to manage emergency situations.

## Context

This project is led by a student to demonstrate his skills to top schools, teachers and professionals.
This project is intended for use by Star Citizen organizations, to alleviate communication problems within the commanding body and those of in-game VOIP, which is not functional (25/03/03 YMD).
This project was submitted for approval and clarified by the [N7 organization](https://n7online.org).

## Project goals

The final aim of the project is to produce a functional, tested and used application, integrating all the functionalities described above.
Two different codes are being developed: a Windows application (+ linux adaptation planned) and a server code.
The success of this project can be seen in the user feedback and the way it spreads.

## Project scope

This project includes:
- the server code
- the Windows app
- a linux adaptation of the windows application
- a documentation
- a range of tests

This project does not include:
- the development of a mobile application (iOS, Android)
- integration with external services other than those described
- management of VOIP-related issues outside the application (e.g. technical issues specific to external platforms)
- creation of a user management platform or public API
- support for distributed server architecture beyond the initial solution

## Project constraints

The project must be completed by the end of the 2024-2025 academic year.
An operational version of the channel system should be available by April 2025.

## Project stakeholders

- [N7 Nours](https://github.com/NoursInDev) (Project Manager)
- [N7 organization](https://n7online.org) (Partner and end user)
  - N7 NyReen (Contributor)
  - N7 SledgeHammer (Contributor)
  - N7 Lill Buck (Contributor)
  - N7 Ophidian (Contributor)

## Macro-planning

| Name               | Description                                                    | Start Date (YMD) | End Date (YMD) |
|--------------------|----------------------------------------------------------------|------------------|----------------|
| Analysis           | Identify needs, draw up technical specifications               | 2025 02 09       | 2025 03 05     |
| Server development | Development of all components, tests and server documentation. | 2025 02 18       | 2025 03 23     |
| Client development | Development of all channel components, tests and user guide.   | 2025 03 17       | 2025 04 06     |
| VOIP support       | Modification of the client to add the use of VOIP.             | 2025 04 07       | 2025 05 04     |

## Resources

Budget Envelope: Almost **zero** (only the cost of the server).

Human resources : 1 developer (NoursInDev), 1 Organization (N7), a contact with Star Citizen Staff & Community.

Material resources : 1 VPS server, 1 PC, JetBrains IDE (IntelliJ IDEA, PhpStorm), Git, GitHub, Discord.

## Communication

1. Internal communication at N7 by completion of the first phase.
2. Broadening of organizations for the first release, presentation on networks.
3. Communication with the Star Citizen community by the end of the second phase.

## Risks

### Technical risks
- VOIP integration issues
- Cross-platform compatibility (Windows/Linux)
- Server problems (latency, overload)
- Communications security
 
### Project management risks
- Delays in deadlines
- Lack of human resources
- Poor communication with stakeholders

### Operational risks
- VPS server management problems
- End-user adoption problems

### External risks
- Dependence on external platforms (Star Citizen)
- Communication problems with external partners (Star Citizen Staff and community)

### Testing risks
- Insufficient load testing
- Problems not identified during testing