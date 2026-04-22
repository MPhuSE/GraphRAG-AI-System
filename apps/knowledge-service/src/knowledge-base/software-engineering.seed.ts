import { KnowledgeDocumentInput } from '../knowledge.types';

export const softwareEngineeringSeedDocuments: KnowledgeDocumentInput[] = [
  {
    title: 'Software Requirements Fundamentals',
    source: 'SE Handbook',
    topic: 'requirements-engineering',
    subtopic: 'requirements-analysis',
    difficulty: 'foundation',
    uri: 'se://requirements/fundamentals',
    tags: [
      'requirements engineering',
      'functional requirement',
      'non-functional requirement',
      'use case',
      'traceability',
    ],
    relationships: [
      {
        source: 'requirements engineering',
        relation: 'PRODUCES',
        target: 'use case',
      },
      {
        source: 'use case',
        relation: 'VALIDATES',
        target: 'functional requirement',
      },
      {
        source: 'traceability',
        relation: 'RELATED_TO',
        target: 'requirements engineering',
      },
    ],
    content: `
Requirements engineering is the discipline of discovering, analysing, documenting, validating, and managing what a software system must do. A strong requirement should be testable, unambiguous, and tied to a business goal.

Functional requirements describe behaviors or services the system must provide. Non-functional requirements describe qualities such as performance, security, maintainability, availability, and usability.

Use cases and user stories are tools to capture interactions from a stakeholder perspective. They do not replace deeper specification work. Teams still need acceptance criteria, constraints, assumptions, and traceability from requirement to design, code, and test.

Professional teams treat requirement changes as controlled decisions. They assess impact, update related artifacts, and keep a change history so downstream engineers can understand why the system evolved.
`.trim(),
  },
  {
    title: 'Software Design and Architecture',
    source: 'SE Handbook',
    topic: 'software-design',
    subtopic: 'architecture',
    difficulty: 'intermediate',
    uri: 'se://design/architecture',
    tags: [
      'software architecture',
      'module',
      'coupling',
      'cohesion',
      'design pattern',
      'layered architecture',
    ],
    relationships: [
      {
        source: 'layered architecture',
        relation: 'PART_OF',
        target: 'software architecture',
      },
      {
        source: 'low coupling',
        relation: 'VALIDATES',
        target: 'software design',
      },
      {
        source: 'design pattern',
        relation: 'USES',
        target: 'software architecture',
      },
    ],
    content: `
Software design turns requirements into a technical solution that developers can implement and maintain. Architecture focuses on high-level structure: components, responsibilities, communication paths, and quality trade-offs.

Good design aims for high cohesion within modules and low coupling between modules. This reduces ripple effects when requirements change and helps teams test components in isolation.

Architectural decisions should be documented with rationale. Teams often use architecture decision records, context diagrams, sequence diagrams, and interface contracts to explain why one solution was chosen over another.

Design patterns such as Strategy, Factory, and Observer are useful when they clarify intent and control variation points. Patterns should solve a concrete design pressure, not be applied for fashion.
`.trim(),
  },
  {
    title: 'Software Testing Strategy',
    source: 'SE Handbook',
    topic: 'software-testing',
    subtopic: 'verification-and-validation',
    difficulty: 'foundation',
    uri: 'se://testing/strategy',
    tags: [
      'software testing',
      'unit test',
      'integration test',
      'system test',
      'regression test',
      'test pyramid',
    ],
    relationships: [
      {
        source: 'unit test',
        relation: 'PART_OF',
        target: 'software testing',
      },
      {
        source: 'integration test',
        relation: 'PART_OF',
        target: 'software testing',
      },
      {
        source: 'regression test',
        relation: 'VALIDATES',
        target: 'software change',
      },
    ],
    content: `
Software testing provides evidence that the system behaves as intended and that defects are detected early. Unit tests check small isolated pieces of behavior. Integration tests check collaboration between components. System tests validate complete workflows from an end-user perspective.

The test pyramid encourages many fast unit tests, fewer integration tests, and a small set of end-to-end tests. This balance keeps feedback quick while still covering realistic flows.

Professional testing strategies connect each test level to risk. Critical business rules, external integrations, security-sensitive paths, and failure recovery scenarios deserve explicit coverage.

Regression testing is essential after each change. A stable automated suite gives teams confidence to refactor and release more often.
`.trim(),
  },
  {
    title: 'CI CD and Release Engineering',
    source: 'SE Handbook',
    topic: 'devops',
    subtopic: 'continuous-delivery',
    difficulty: 'intermediate',
    uri: 'se://devops/ci-cd',
    tags: [
      'continuous integration',
      'continuous delivery',
      'deployment pipeline',
      'release engineering',
      'automation',
      'rollback',
    ],
    relationships: [
      {
        source: 'continuous integration',
        relation: 'PREREQUISITE_OF',
        target: 'continuous delivery',
      },
      {
        source: 'deployment pipeline',
        relation: 'USES',
        target: 'automation',
      },
      {
        source: 'rollback',
        relation: 'VALIDATES',
        target: 'release engineering',
      },
    ],
    content: `
Continuous integration means developers merge work frequently and validate each change with automated build and test steps. Continuous delivery extends this by keeping software in a releasable state.

A professional deployment pipeline includes source control checks, dependency installation, static analysis, automated tests, packaging, environment promotion, and deployment verification. Pipelines should fail fast and surface actionable feedback.

Release engineering also covers versioning, change logs, rollback plans, and operational readiness. Shipping fast is only useful when teams can also recover safely from incidents.

Teams should measure lead time, failure rate, recovery time, and deployment frequency so process improvements are based on evidence.
`.trim(),
  },
  {
    title: 'Code Review and Maintainability',
    source: 'SE Handbook',
    topic: 'maintainability',
    subtopic: 'code-review',
    difficulty: 'foundation',
    uri: 'se://maintainability/code-review',
    tags: [
      'code review',
      'maintainability',
      'refactoring',
      'clean code',
      'technical debt',
      'coding standard',
    ],
    relationships: [
      {
        source: 'code review',
        relation: 'VALIDATES',
        target: 'maintainability',
      },
      {
        source: 'refactoring',
        relation: 'RELATED_TO',
        target: 'technical debt',
      },
      {
        source: 'coding standard',
        relation: 'USES',
        target: 'code review',
      },
    ],
    content: `
Code review is a quality gate and a learning mechanism. Effective reviews focus on correctness, readability, testability, security, architecture fit, and long-term maintenance cost.

Professional teams keep review scope manageable. Small pull requests with clear intent are reviewed faster and produce better feedback than large mixed changes.

Maintainability improves when code communicates intent, avoids hidden coupling, and keeps business rules explicit. Refactoring is not cosmetic work; it is a disciplined way to reduce technical debt and improve future delivery speed.

Review comments should be specific and actionable. Teams often distinguish between blocking issues, suggestions, and style preferences to reduce friction.
`.trim(),
  },
];
