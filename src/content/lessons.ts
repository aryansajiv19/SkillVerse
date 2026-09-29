// "What you'll learn" for each skill's lesson: the ideas the reading covers and the
// knowledge check asks about. Keep each line short and concrete.

export const lessonTopics: Record<string, string[]> = {
  // Frontend
  html: [
    "How a page is structured: doctype, head and body",
    "Headings, paragraphs, links, lists and images",
    "Semantic elements like header, nav, main and article",
    "Forms and inputs that collect data",
  ],
  css: [
    "Selectors, specificity and the cascade",
    "The box model: margin, border, padding",
    "Layouts with flexbox and grid",
    "Units like rem and %, and responsive design",
  ],
  javascript: [
    "Variables, types and functions",
    "Arrays and objects, and methods like map and filter",
    "Comparison, conditionals and loops",
    "Working with the DOM and events",
  ],
  a11y: [
    "Why accessibility matters and who it helps",
    "Alt text, labels and accessible names",
    "Keyboard navigation and focus",
    "Colour contrast and the WCAG AA targets",
  ],
  tailwind: [
    "The utility-first approach",
    "Spacing, colour and typography utilities",
    "Responsive prefixes like md: and lg:",
    "Only shipping the classes you use",
  ],
  typescript: [
    "Type annotations and inference",
    "Interfaces, unions and generics",
    "Narrowing with typeof and type guards",
    "Why types disappear at runtime",
  ],
  react: [
    "Components and props",
    "State with useState and effects with useEffect",
    "Rendering lists with keys",
    "Updating state without mutating it",
  ],
  nextjs: [
    "The App Router and file-based routes",
    "Server Components and \"use client\"",
    "Fetching data and API route handlers",
    "Deploying a Next.js app",
  ],

  // Backend
  nodejs: [
    "Running JavaScript outside the browser",
    "Modules and npm packages",
    "The event loop and async code",
    "Reading files and handling requests",
  ],
  express: [
    "Routes and route parameters",
    "Middleware and next()",
    "Handling JSON requests and responses",
    "Error-handling middleware",
  ],
  "rest-apis": [
    "Resources and HTTP methods",
    "Status codes and what they mean",
    "Pagination and filtering",
    "Designing clean, predictable endpoints",
  ],
  sql: [
    "SELECT, WHERE and ORDER BY",
    "Joining tables",
    "GROUP BY, aggregates and HAVING",
    "Inserting, updating and deleting rows",
  ],
  postgres: [
    "Tables, constraints and data types",
    "Transactions and why they matter",
    "Indexes and query performance",
    "JSONB and row-level security",
  ],
  auth: [
    "Authentication vs authorization",
    "Hashing passwords safely",
    "Sessions, JWTs and their trade-offs",
    "Signing in with OAuth providers",
  ],
  fastapi: [
    "Path operations and parameters",
    "Validating requests with Pydantic models",
    "Async endpoints",
    "Automatic OpenAPI docs",
  ],

  // Data & AI
  python: [
    "Variables, types and control flow",
    "Lists, dicts, sets and tuples",
    "Functions and modules",
    "Reading and writing files",
  ],
  pandas: [
    "Series and DataFrames",
    "Loading and cleaning data",
    "Filtering, sorting and selecting",
    "Grouping and aggregating",
  ],
  "data-viz": [
    "Choosing the right chart for the question",
    "Axes, scales and honest baselines",
    "Using colour with purpose",
    "Telling a clear story with a chart",
  ],
  "ml-basics": [
    "Supervised vs unsupervised learning",
    "Training and test splits",
    "Regression and classification",
    "Overfitting and evaluation metrics",
  ],
  "deep-learning": [
    "Neurons, layers and activation functions",
    "Loss functions and gradient descent",
    "Embeddings",
    "How transformers use attention",
  ],
  "llm-apps": [
    "Prompting and system messages",
    "Retrieval-augmented generation (RAG)",
    "Tool calling and structured output",
    "Evaluating model output",
  ],

  // DevOps & Cloud
  git: [
    "Commits and the staging area",
    "Branching and merging",
    "Remotes, push and pull",
    "Pull requests and resolving conflicts",
  ],
  linux: [
    "Navigating the file system from the shell",
    "Files, permissions and chmod",
    "Processes, pipes and redirection",
    "Installing and managing packages",
  ],
  docker: [
    "Images vs containers",
    "Writing a Dockerfile",
    "Volumes and networking",
    "Multi-stage builds",
  ],
  "ci-cd": [
    "What continuous integration means",
    "Writing a GitHub Actions workflow",
    "Running tests on every push",
    "Deploying automatically and rolling back",
  ],
  kubernetes: [
    "Pods, deployments and services",
    "Scaling and self-healing",
    "Config and secrets",
    "Deploying with kubectl",
  ],
  cloud: [
    "Compute, storage and networking",
    "Identity and least-privilege access",
    "Object storage for files",
    "Autoscaling and paying for what you use",
  ],
  iac: [
    "Why define infrastructure as code",
    "Providers, resources and variables",
    "The plan and apply workflow",
    "Managing state safely",
  ],
};
