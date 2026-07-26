# ContentOS Product Vision

**Version:** 0.1  
**Status:** Active Draft  
**Product Stage:** Product Discovery  
**Last Updated:** 2026-07-26

---

## 1. Product Definition

ContentOS is an AI-powered content operating system that helps individual creators transform valuable external information into original, high-quality, multi-platform content assets.

The product is designed as a personal AI content studio powered by a team of specialized AI agents.

Instead of using one large prompt to generate an article, ContentOS coordinates multiple specialized capabilities across research, writing, content packaging, visual communication, rendering, publishing preparation, memory, and performance analysis.

The initial supported content outputs are:

- Personal blog articles
- Xiaohongshu carousel posts

The initial content domain is:

- AI tools
- AI agents
- AI products
- AI industry trends
- High-quality overseas AI content

---

## 2. Problem

Individual creators regularly discover valuable information from sources such as:

- X posts and threads
- External articles
- Newsletters
- Research papers
- Product announcements
- Technical documentation

Turning one useful source into original content requires many separate activities:

1. Saving and organizing the source
2. Understanding the original material
3. Extracting its important arguments and facts
4. Verifying claims
5. Developing a personal opinion
6. Writing a long-form article
7. Adapting the topic for different platforms
8. Creating titles, covers, and page headings
9. Producing diagrams, illustrations, and visual assets
10. Rendering publishable content
11. Reviewing quality and source attribution
12. Publishing and analyzing performance

This process is repetitive, fragmented, and difficult to maintain consistently.

Existing AI writing tools often reduce the problem to:

```text
Prompt
→ Generated article
```

This approach creates several problems:

- AI-generated content is easy to replicate.
- Source facts, AI interpretations, and human opinions are mixed together.
- Platform-specific content behavior is ignored.
- Visual output lacks consistency.
- The creator’s own judgment and experience become less visible.
- There is no reliable content memory or performance feedback loop.

---

## 3. Product Vision

ContentOS aims to become the operating system for an individual AI content creator.

The product should allow a creator to submit a valuable information source and work with an AI content team to produce a complete Content Package.

A Content Package may contain:

- Original source material
- Structured research
- Verified facts and unresolved claims
- AI analysis
- Human opinions and experiences
- Blog content
- Xiaohongshu content
- Platform titles
- Cover titles and subtitles
- Page-level headings and copy
- Design specifications
- Visual assets
- Rendered output
- Publishing metadata
- Performance data
- Future optimization recommendations

ContentOS should not attempt to replace the creator.

It should reduce repetitive work while making the creator’s judgment, perspective, and experience more visible.

---

## 4. Target User

### Primary User

The initial target user is an individual AI content creator who:

- Regularly reads AI-related information
- Wants to publish original content consistently
- Operates a personal blog or social media account
- Needs help understanding and restructuring complex information
- Wants to build a recognizable personal brand
- Values content quality over publishing volume
- Is willing to review and approve AI-generated work

The first version is designed as a single-user product rather than a multi-tenant SaaS platform.

### Initial User Profile

The initial user may be:

- An aspiring AI product manager
- An AI tools reviewer
- An AI educator
- A technical content creator
- An independent researcher
- A professional building a personal AI brand

---

## 5. Core Value Proposition

ContentOS helps a creator turn:

```text
One valuable source
```

into:

```text
One structured and reusable Content Package
```

which can then produce:

```text
A high-quality blog article
+
A platform-native Xiaohongshu carousel
+
Reusable visual and knowledge assets
```

The product’s primary value is not the volume of generated content.

Its value comes from:

- Better source understanding
- Clear separation of information and opinion
- Stronger personal expression
- Platform-specific content packaging
- Consistent visual communication
- Reusable content memory
- A measurable improvement loop

---

## 6. Product Principles

### 6.1 AI Enhances Human Judgment

AI should support research, organization, writing, and visual communication.

It must not replace the creator’s final judgment or invent personal experiences.

Human input remains essential for:

- Personal opinions
- Real experiences
- Sensitive claims
- Final content approval
- Publishing decisions

---

### 6.2 Source, AI Analysis, and Human Opinion Must Remain Separate

ContentOS must preserve three distinct information layers:

```text
Original Source
AI Analysis
Human Opinion
```

The system must make it possible to identify:

- What the original author said
- What the AI inferred or summarized
- What the creator personally believes

These layers must not be silently merged.

---

### 6.3 ContentOS Produces Content Assets, Not Only Articles

The central product object is the Content Package, not an individual article.

A blog article, Xiaohongshu carousel, image, diagram, or analytics report is one output derived from that package.

---

### 6.4 Blog and Xiaohongshu Are Different Product Outputs

A Xiaohongshu post must not be created by simply shortening a blog article.

The two outputs serve different user behaviors.

#### Blog

Optimizes for:

- Completeness
- Depth
- Search discoverability
- Long-term reference value
- Internal linking

#### Xiaohongshu

Optimizes for:

- Feed discovery
- Immediate clarity
- Click-through
- Reading momentum
- Saves and shares
- Visual communication

Both outputs share the same source and core reasoning, but they require different structures and packaging strategies.

---

### 6.5 Quality Is More Important Than Publishing Volume

ContentOS is not a bulk content-spam system.

The intended model is:

```text
One valuable source
→ Careful understanding
→ Original interpretation
→ One high-quality content package
```

The product should not optimize for generating dozens of low-quality posts per day.

---

### 6.6 Specialized Agents Must Have Clear Responsibilities

ContentOS uses specialized AI agents instead of one all-purpose agent.

Each agent must have:

- A defined goal
- Explicit responsibilities
- Structured input
- Structured output
- Clear limitations
- Validation criteria
- Failure handling
- Human approval requirements where appropriate

An agent must not silently take ownership of another agent’s responsibilities.

---

### 6.7 Agent Communication Must Be Structured

Agents should exchange validated structured data rather than relying on unbounded natural-language conversations.

Structured contracts should support:

- Validation
- Reproducibility
- Debugging
- Human editing
- Rendering
- Versioning
- Model replacement

JSON Schema or an equivalent typed structure should be used for important agent outputs.

---

### 6.8 Planning and Execution Must Be Separated

The Chief Editor coordinates the content team.

Its architecture combines:

- An LLM-based Planner
- A deterministic Executor
- Rule-based and model-assisted Validators

The Planner may recommend what should happen.

The Executor controls what actually happens.

This separation is required to balance flexibility with reliability.

---

### 6.9 Important Actions Require Human Approval

The MVP uses semi-automated orchestration.

Human approval is required at important checkpoints, including:

- Confirming the creation plan
- Adding or approving personal opinions
- Approving factual claims when uncertainty remains
- Selecting final packaging
- Approving the visual direction
- Publishing public content

---

### 6.10 Visual Communication Must Serve Understanding

Images should not be generated only for decoration.

A visual asset should help the reader:

- Understand an abstract concept
- See a relationship
- Follow a process
- Compare two approaches
- Remember an important idea

The Visual Agent determines how information should be visualized.

---

### 6.11 Design Specification and Rendering Must Be Separate

AI does not directly generate the final Xiaohongshu page.

The visual production pipeline is divided into:

```text
Visual Agent
→ Design Specification
→ Image Generation Service, when needed
→ Render Engine
→ Final Output
```

The Design Specification may define:

- Page purpose
- Heading
- Body copy
- Highlighted words
- Visual type
- Layout
- Image requirement
- Image-generation prompt
- Brand theme

The Image Generation Service produces optional image assets.

The Render Engine combines content, image assets, components, and brand rules into final output.

---

### 6.12 Templates Control Layout and Typography

Important Chinese text should not be rendered by image-generation models.

Text, spacing, typography, branding, and page layout should be controlled by a deterministic component-based rendering system.

The initial direction is:

```text
Structured Content
→ React Components
→ Template System
→ Browser Rendering
→ PNG Export
```

---

### 6.13 Platform Knowledge Is a Shared Product Capability

Platform rules should not be permanently embedded inside one prompt or one agent.

ContentOS maintains a Platform Intelligence Layer that may include:

- Official creator guidance
- Platform policies
- Content-format requirements
- Search and discovery behavior
- Packaging patterns
- High-performing internal examples
- Historical account performance
- Time-sensitive platform changes

Packaging, publishing, and analytics capabilities may all use this knowledge.

---

### 6.14 Models Must Be Replaceable

Agents must not be permanently bound to a specific LLM provider.

ContentOS should support a Model Router capable of selecting models according to:

- Task type
- Required quality
- Context length
- Latency
- Cost
- Tool support
- Structured-output reliability

The product may use different models for research, writing, packaging, validation, and analytics.

---

### 6.15 Product Knowledge Must Be Persisted Outside Chat History

Chat conversations are useful for exploration, but they are not the project’s source of truth.

The repository documentation must contain the current product truth.

Historical discussions belong in session documents.

Accepted decisions belong in the decision log.

Current behavior belongs in product, agent, and architecture specifications.

---

## 7. System Overview

ContentOS is currently envisioned as:

```text
User
  ↓
Web Application
  ↓
Chief Editor
  ├── LLM Planner
  ├── Deterministic Executor
  └── Validators
  ↓
Specialized Agent Team
  ├── Research Agent
  ├── Writer Agent
  ├── Packaging Agent
  ├── Visual Agent
  ├── Render Agent / Render Engine
  ├── Publisher Agent
  └── Analytics Agent
  ↓
Content Package
  ↓
Knowledge Layer
  ├── Content Memory
  ├── Brand Memory
  ├── Platform Intelligence
  └── User Preferences
  ↓
Model Router
  ↓
LLM and Image Providers
```

This overview expresses the intended direction. Detailed implementation decisions belong in the architecture documents rather than this vision document.

---

## 8. Initial Product Experience

The MVP is a personal web application with a combined Dashboard and Chat experience.

### Dashboard

The dashboard should make the content workflow visible.

It may show:

- Inbox
- Sources
- Content Packages
- Current workflow stage
- Completed agent tasks
- Pending approvals
- Blog drafts
- Xiaohongshu packages
- Visual assets
- Rendered outputs
- Publishing status

### Chief Editor Chat

The chat interface allows the user to:

- Submit a source
- Describe the intended output
- Ask questions about the material
- Review the proposed execution plan
- Provide personal opinions
- Request revisions
- Approve important workflow stages

The chat experience must not hide important project state.

The Dashboard remains the authoritative view of the current Content Package.

---

## 9. Initial Content Workflow

The initial end-to-end workflow is:

```text
Submit source
→ Preserve original material
→ Produce structured research
→ Identify claims requiring verification
→ Ask the creator for opinions
→ Generate an approved content foundation
→ Produce a blog version
→ Produce a Xiaohongshu packaging strategy
→ Create a design specification
→ Generate optional visual assets
→ Render final output
→ Request human approval
→ Prepare content for publishing
→ Record performance data
```

Not every Content Package must use every stage.

The Chief Editor proposes a plan based on the user’s goal, and the user confirms important steps during the MVP phase.

---

## 10. Product Boundaries

### ContentOS Is

- A personal AI content operating system
- A multi-agent content creation product
- A content asset management system
- A human-in-the-loop creative workspace
- A system for producing platform-native content
- A long-term content and brand knowledge base

### ContentOS Is Not

- A generic chatbot
- A single-prompt article generator
- A bulk content-spam tool
- A fully autonomous publishing bot
- A system designed to bypass platform restrictions
- A replacement for human opinions
- A complete social media management suite in the MVP
- A multi-user SaaS product in the first release
- A platform-specific product limited permanently to Xiaohongshu

---

## 11. MVP Vision

The first usable version should allow one creator to complete one high-quality content cycle.

The MVP should demonstrate:

1. A user can submit an article, X post, or manually supplied source text.
2. The system preserves the source.
3. The Research Agent creates structured research.
4. The user can add and approve personal opinions.
5. The Writer Agent creates a blog draft.
6. The Packaging Agent creates Xiaohongshu title and carousel candidates.
7. The system stores platform title, cover title, and page headings separately.
8. The Visual Agent creates a design specification.
9. The rendering system produces editable and exportable carousel images.
10. The user approves content before publishing.
11. The complete process is represented as one Content Package.

The MVP does not need to demonstrate full autonomous orchestration.

---

## 12. Long-Term Direction

ContentOS may eventually support:

- Multiple publishing platforms
- Personal brand learning
- Reusable visual libraries
- Automated internal linking
- Historical content recommendations
- Performance-driven title optimization
- Platform-specific knowledge retrieval
- Multiple content domains
- Team collaboration
- Configurable agent workflows
- Model routing and cost optimization
- Additional media types such as video or newsletters
- A multi-user SaaS version

These capabilities are future directions and are not automatically part of the MVP.

---

## 13. Success Definition

ContentOS succeeds when it helps a creator:

- Understand valuable information more deeply
- Develop a clearer personal opinion
- Produce stronger content with less repetitive work
- Adapt one topic correctly for different platforms
- Maintain consistent visual and verbal branding
- Preserve source traceability
- Build reusable content knowledge over time
- Improve future work using actual publishing results

The primary success metric is not the number of generated posts.

The primary success is whether the system consistently helps turn valuable information into original content worth reading, saving, and remembering.

---

## 14. Current Project Status

ContentOS is currently in the Product Discovery and Architecture Definition phase.

Completed foundations include:

- Product origin and problem definition
- Content Package concept
- Multi-agent product direction
- Chief Editor coordination model
- Human-in-the-loop MVP strategy
- Design Specification approach
- Component-based rendering direction
- Documentation and decision-governance structure

The next design area is:

```text
Content Package data model
+
Database architecture
+
Memory Layer
+
RAG boundaries
```

Implementation should not begin with a full autonomous multi-agent system.

The first implementation should prioritize a small, testable, end-to-end vertical slice.