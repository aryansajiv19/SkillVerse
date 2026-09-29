// Free, official or canonical reading for each skill, shown before its skill check.
// Every URL was checked to load (HTTP 200) when added.

export interface Resource {
  title: string;
  /** Who publishes it, shown next to the title */
  source: string;
  url: string;
}

export const resources: Record<string, Resource[]> = {
  // Frontend
  html: [
    { title: "Learn HTML", source: "web.dev", url: "https://web.dev/learn/html" },
    { title: "Structuring content with HTML", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content" },
  ],
  css: [
    { title: "Learn CSS", source: "web.dev", url: "https://web.dev/learn/css" },
    { title: "Basic concepts of flexbox", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts" },
    { title: "Basic concepts of grid layout", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts" },
  ],
  javascript: [
    { title: "JavaScript Guide", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
    { title: "The Modern JavaScript Tutorial", source: "javascript.info", url: "https://javascript.info/" },
  ],
  a11y: [
    { title: "Learn Accessibility", source: "web.dev", url: "https://web.dev/learn/accessibility" },
    { title: "Introduction to web accessibility", source: "W3C WAI", url: "https://www.w3.org/WAI/fundamentals/accessibility-intro/" },
    { title: "The label element", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label" },
  ],
  tailwind: [
    { title: "Styling with utility classes", source: "Tailwind CSS", url: "https://tailwindcss.com/docs/styling-with-utility-classes" },
    { title: "Responsive design", source: "Tailwind CSS", url: "https://tailwindcss.com/docs/responsive-design" },
  ],
  typescript: [
    { title: "The TypeScript Handbook", source: "typescriptlang.org", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
    { title: "Narrowing", source: "typescriptlang.org", url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html" },
  ],
  react: [
    { title: "Quick start", source: "react.dev", url: "https://react.dev/learn" },
    { title: "Thinking in React", source: "react.dev", url: "https://react.dev/learn/thinking-in-react" },
    { title: "Extracting state logic into a reducer", source: "react.dev", url: "https://react.dev/learn/extracting-state-logic-into-a-reducer" },
  ],
  nextjs: [
    { title: "Learn Next.js", source: "nextjs.org", url: "https://nextjs.org/learn" },
    { title: "Server and Client Components", source: "nextjs.org", url: "https://nextjs.org/docs/app/getting-started/server-and-client-components" },
  ],

  // Backend
  nodejs: [
    { title: "Introduction to Node.js", source: "nodejs.org", url: "https://nodejs.org/learn/getting-started/introduction-to-nodejs" },
    { title: "The event loop, timers and process.nextTick()", source: "nodejs.org", url: "https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick" },
  ],
  express: [
    { title: "Routing", source: "expressjs.com", url: "https://expressjs.com/en/guide/routing/" },
    { title: "Using middleware", source: "expressjs.com", url: "https://expressjs.com/en/guide/using-middleware/" },
    { title: "Error handling", source: "expressjs.com", url: "https://expressjs.com/en/guide/error-handling/" },
  ],
  "rest-apis": [
    { title: "An overview of HTTP", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview" },
    { title: "HTTP request methods", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods" },
    { title: "HTTP response status codes", source: "MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status" },
  ],
  sql: [
    { title: "Interactive SQL lessons", source: "SQLBolt", url: "https://sqlbolt.com/" },
    { title: "The SQL language", source: "PostgreSQL docs", url: "https://www.postgresql.org/docs/current/tutorial-sql.html" },
  ],
  postgres: [
    { title: "PostgreSQL tutorial", source: "PostgreSQL docs", url: "https://www.postgresql.org/docs/current/tutorial.html" },
    { title: "JSON types", source: "PostgreSQL docs", url: "https://www.postgresql.org/docs/current/datatype-json.html" },
    { title: "Row security policies", source: "PostgreSQL docs", url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html" },
  ],
  auth: [
    { title: "Password storage cheat sheet", source: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
    { title: "Authentication cheat sheet", source: "OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
    { title: "Introduction to JSON Web Tokens", source: "jwt.io", url: "https://www.jwt.io/introduction" },
  ],
  fastapi: [
    { title: "Tutorial: user guide", source: "FastAPI", url: "https://fastapi.tiangolo.com/tutorial/" },
    { title: "Request body", source: "FastAPI", url: "https://fastapi.tiangolo.com/tutorial/body/" },
  ],

  // Data & AI
  python: [
    { title: "The Python tutorial", source: "docs.python.org", url: "https://docs.python.org/3/tutorial/" },
    { title: "Data structures", source: "docs.python.org", url: "https://docs.python.org/3/tutorial/datastructures.html" },
  ],
  pandas: [
    { title: "10 minutes to pandas", source: "pandas docs", url: "https://pandas.pydata.org/docs/user_guide/10min.html" },
    { title: "Group by: split-apply-combine", source: "pandas docs", url: "https://pandas.pydata.org/docs/user_guide/groupby.html" },
  ],
  "data-viz": [
    { title: "Fundamentals of Data Visualization", source: "Claus O. Wilke", url: "https://clauswilke.com/dataviz/" },
    { title: "Chart visualization", source: "pandas docs", url: "https://pandas.pydata.org/docs/user_guide/visualization.html" },
  ],
  "ml-basics": [
    { title: "Machine Learning Crash Course", source: "Google", url: "https://developers.google.com/machine-learning/crash-course" },
    { title: "Getting started", source: "scikit-learn", url: "https://scikit-learn.org/stable/getting_started.html" },
    { title: "Cross-validation", source: "scikit-learn", url: "https://scikit-learn.org/stable/modules/cross_validation.html" },
  ],
  "deep-learning": [
    { title: "Neural networks", source: "3Blue1Brown", url: "https://www.3blue1brown.com/lessons/neural-networks/" },
    { title: "Deep Learning", source: "Goodfellow, Bengio and Courville", url: "https://www.deeplearningbook.org/" },
  ],
  "llm-apps": [
    { title: "LLM course", source: "Hugging Face", url: "https://huggingface.co/learn/llm-course/chapter1/1" },
    { title: "Prompt engineering overview", source: "Anthropic", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview" },
    { title: "Gemini API docs", source: "Google AI for Developers", url: "https://ai.google.dev/gemini-api/docs" },
  ],

  // DevOps & Cloud
  git: [
    { title: "Pro Git", source: "git-scm.com", url: "https://git-scm.com/book/en/v2" },
    { title: "Branches in a nutshell", source: "git-scm.com", url: "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell" },
  ],
  linux: [
    { title: "The Linux command line for beginners", source: "Ubuntu", url: "https://ubuntu.com/tutorials/command-line-for-beginners" },
    { title: "The Linux Command Line", source: "William Shotts", url: "https://linuxcommand.org/tlcl.php" },
  ],
  docker: [
    { title: "Get started", source: "Docker docs", url: "https://docs.docker.com/get-started/" },
    { title: "Multi-stage builds", source: "Docker docs", url: "https://docs.docker.com/build/building/multi-stage/" },
  ],
  "ci-cd": [
    { title: "GitHub Actions documentation", source: "GitHub Docs", url: "https://docs.github.com/en/actions" },
    { title: "Continuous integration", source: "Martin Fowler", url: "https://martinfowler.com/articles/continuousIntegration.html" },
    { title: "Semantic versioning", source: "semver.org", url: "https://semver.org/" },
  ],
  kubernetes: [
    { title: "Learn Kubernetes basics", source: "kubernetes.io", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" },
    { title: "Pods", source: "kubernetes.io", url: "https://kubernetes.io/docs/concepts/workloads/pods/" },
    { title: "Service", source: "kubernetes.io", url: "https://kubernetes.io/docs/concepts/services-networking/service/" },
  ],
  cloud: [
    { title: "Security best practices in IAM", source: "AWS docs", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html" },
    { title: "Policy evaluation logic", source: "AWS docs", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html" },
    { title: "What is cloud computing?", source: "Google Cloud", url: "https://cloud.google.com/learn/what-is-cloud-computing" },
  ],
  iac: [
    { title: "Get started with Terraform", source: "HashiCorp", url: "https://developer.hashicorp.com/terraform/tutorials/aws-get-started" },
    { title: "State", source: "HashiCorp", url: "https://developer.hashicorp.com/terraform/language/state" },
    { title: "terraform plan", source: "HashiCorp", url: "https://developer.hashicorp.com/terraform/cli/commands/plan" },
  ],
};
