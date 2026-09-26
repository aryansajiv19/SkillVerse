// Challenges per skill. Every skill has exactly one quiz with id `${skillId}-check`;
// passing it masters the skill. Code challenges and games are optional bonus XP.
// XP values are mirrored server-side via supabase/catalog.sql (npm run db:catalog).

export type Difficulty = "beginner" | "intermediate" | "advanced";

interface Base {
  id: string;
  skillId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
}

export interface Question {
  question: string;
  type: "multiple-choice" | "fill-in-blank" | "true-false";
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  hint?: string;
}

export interface QuizChallenge extends Base {
  type: "quiz";
  questions: Question[];
}

export type CodeTest =
  | { lang: "js"; expr: string; expected: unknown }
  | { lang: "html"; selector: string; label: string }
  | { lang: "css"; selector: string; prop: string; value: string[]; label: string };

export interface CodeChallenge extends Base {
  type: "code";
  lang: "js" | "html" | "css";
  starterCode: string;
  hints: string[];
  tests: CodeTest[];
}

export interface GameChallenge extends Base {
  type: "game";
  gameType: "debugger";
}

export type Challenge = QuizChallenge | CodeChallenge | GameChallenge;

export const SKILL_MASTERY_XP = 100;
export const checkIdFor = (skillId: string) => `${skillId}-check`;

const mc = (question: string, options: string[], correctAnswer: number, explanation: string): Question =>
  ({ question, type: "multiple-choice", options, correctAnswer, explanation });
const tf = (question: string, answer: boolean, explanation: string): Question =>
  ({ question, type: "true-false", options: ["True", "False"], correctAnswer: answer ? 0 : 1, explanation });
const fill = (question: string, answer: string, explanation: string): Question =>
  ({ question, type: "fill-in-blank", correctAnswer: answer, explanation });

const check = (skillId: string, name: string, questions: Question[]): QuizChallenge => ({
  id: checkIdFor(skillId),
  skillId,
  type: "quiz",
  title: `${name} Skill Check`,
  description: `Pass this to master ${name} and light up its star.`,
  difficulty: "beginner",
  xpReward: 30,
  questions,
});

const js = (expr: string, expected: unknown): CodeTest => ({ lang: "js", expr, expected });
const el = (selector: string, label: string): CodeTest => ({ lang: "html", selector, label });
const rule = (selector: string, prop: string, value: string[], label: string): CodeTest =>
  ({ lang: "css", selector, prop, value, label });

export const challenges: Challenge[] = [
  // ───────────── Frontend ─────────────
  check("html", "HTML", [
    { ...mc("What does HTML stand for?", ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], 0,
      "HTML stands for Hyper Text Markup Language, the standard markup language for web pages."),
      hint: "Links between text (Hyper), the content (Text), and how it's structured (Markup)." },
    mc("Which tag is used for the largest heading?", ["<heading>", "<h6>", "<head>", "<h1>"], 3,
      "<h1> is the largest heading, <h6> the smallest."),
    tf("HTML tags are case-sensitive.", false,
      "<div>, <DIV> and <DiV> all work, but lowercase is the convention."),
    fill("The _____ tag defines an unordered list.", "ul",
      "<ul> creates a bulleted list; <ol> creates a numbered one."),
  ]),
  {
    id: "html-1", skillId: "html", type: "code", lang: "html",
    title: "Your First Page", description: "Build a page with a title, a heading and a paragraph.",
    difficulty: "beginner", xpReward: 50,
    starterCode: "<!DOCTYPE html>\n<html>\n  <!-- add a head with a title, and a body -->\n</html>\n",
    hints: ["Put a <title> inside <head>", "Use <h1> for the heading and <p> for the paragraph", "Both go inside <body>"],
    tests: [el("head > title", "has a <title> in <head>"), el("body h1", "has an <h1> in <body>"), el("body p", "has a <p> in <body>")],
  },

  check("css", "CSS", [
    mc("Which declaration makes an element a flex container?", ["display: flex", "flex: 1", "position: flex", "align: flex"], 0,
      "display: flex turns the element into a flex container; flex: 1 is for flex items."),
    tf("Padding sits outside an element's border.", false, "Padding is inside the border; margin is outside."),
    fill("The unit relative to the root element's font size is ___.", "rem", "rem = root em. 1rem is the <html> font size."),
  ]),
  {
    id: "css-1", skillId: "css", type: "code", lang: "css",
    title: "Center a Div", description: "Center .container's children horizontally and vertically with flexbox.",
    difficulty: "beginner", xpReward: 50,
    starterCode: ".container {\n  /* your CSS here */\n}\n",
    hints: ["Start with display: flex", "justify-content handles the main axis", "align-items handles the cross axis"],
    tests: [
      rule(".container", "display", ["flex"], "display: flex"),
      rule(".container", "justify-content", ["center"], "justify-content: center"),
      rule(".container", "align-items", ["center"], "align-items: center"),
    ],
  },
  {
    id: "css-2", skillId: "css", type: "code", lang: "css",
    title: "Three-Column Grid", description: "Make .grid a grid with three equal columns and a gap.",
    difficulty: "intermediate", xpReward: 60,
    starterCode: ".grid {\n  \n}\n",
    hints: ["display: grid", "repeat(3, 1fr) makes three equal columns", "gap sets spacing between cells"],
    tests: [
      rule(".grid", "display", ["grid"], "display: grid"),
      rule(".grid", "grid-template-columns", ["repeat(3, 1fr)", "1fr 1fr 1fr"], "three equal columns"),
      rule(".grid", "gap", ["*"], "has a gap"),
    ],
  },

  check("javascript", "JavaScript", [
    mc("What does [1, 2, 3].map(x => x * 2) return?", ["[2, 4, 6]", "6", "[1, 2, 3]", "undefined"], 0,
      "map returns a new array with the callback applied to every element."),
    tf("`const` makes an object immutable.", false,
      "const only prevents reassigning the binding. The object itself can still be mutated."),
    mc("Which operator compares value AND type?", ["===", "==", "=", "!="], 0, "=== is strict equality: no type coercion."),
  ]),
  {
    id: "js-1", skillId: "javascript", type: "code", lang: "js",
    title: "Create a Function", description: "Write add(a, b) that returns the sum of two numbers.",
    difficulty: "beginner", xpReward: 50,
    starterCode: "function add(a, b) {\n  // your code here\n}\n",
    hints: ["Use the return keyword", "Return a + b"],
    tests: [js("add(2, 3)", 5), js("add(10, 20)", 30), js("add(-1, 1)", 0)],
  },
  {
    id: "js-2", skillId: "javascript", type: "code", lang: "js",
    title: "Reverse a String", description: "Write reverse(str) that returns the string backwards.",
    difficulty: "beginner", xpReward: 50,
    starterCode: "function reverse(str) {\n  \n}\n",
    hints: ["Strings can be split into arrays", "Arrays have a reverse() method", "join('') turns an array back into a string"],
    tests: [js("reverse('abc')", "cba"), js("reverse('')", ""), js("reverse('racecar')", "racecar")],
  },
  {
    id: "js-3", skillId: "javascript", type: "code", lang: "js",
    title: "FizzBuzz", description: "Write fizzBuzz(n) returning an array for 1..n: 'Fizz' for multiples of 3, 'Buzz' for 5, 'FizzBuzz' for both, otherwise the number.",
    difficulty: "intermediate", xpReward: 60,
    starterCode: "function fizzBuzz(n) {\n  const out = [];\n  \n  return out;\n}\n",
    hints: ["Loop from 1 to n inclusive", "Check the 'both' case (i % 15) first", "Push numbers as numbers, not strings"],
    tests: [js("fizzBuzz(5)", [1, 2, "Fizz", 4, "Buzz"]), js("fizzBuzz(15)[14]", "FizzBuzz"), js("fizzBuzz(0)", [])],
  },
  {
    id: "js-game-1", skillId: "javascript", type: "game", gameType: "debugger",
    title: "Planet Debugger", description: "Fix broken snippets against the clock to repair planets.",
    difficulty: "intermediate", xpReward: 100,
  },

  check("a11y", "Accessibility", [
    mc("What should a purely decorative image's alt text be?", ['An empty string (alt="")', "The file name", '"image"', "Leave out the alt attribute"], 0,
      'alt="" tells screen readers to skip it. A missing alt makes some readers announce the file name.'),
    tf("A <div> with an onClick handler is as accessible as a <button>.", false,
      "A div gets no keyboard focus, no Enter/Space handling and no button role. Use <button>."),
    mc("Minimum WCAG AA contrast for normal body text?", ["4.5:1", "2:1", "3:1", "7:1"], 0, "AA needs 4.5:1 (3:1 for large text). 7:1 is AAA."),
  ]),
  {
    id: "a11y-1", skillId: "a11y", type: "code", lang: "html",
    title: "Accessible Sign-up Form", description: "Build a form where every input has a label, the image has alt text, and there's a real submit button.",
    difficulty: "intermediate", xpReward: 60,
    starterCode: '<form>\n  <img src="logo.png">\n  <input type="email">\n  <div onclick="submit()">Sign up</div>\n</form>\n',
    hints: ['Give the input an id and add <label for="that-id">', "Every <img> needs an alt attribute", 'Replace the div with <button type="submit">'],
    tests: [
      el("img[alt]", "image has alt text"),
      el("input[id]", "input has an id"),
      el("label[for]", "a <label for=…> exists"),
      el('button[type="submit"]', 'uses <button type="submit">'),
    ],
  },

  check("tailwind", "Tailwind", [
    mc("Which class applies only from the md breakpoint up?", ["md:flex", "flex-md", "@md flex", "flex:md"], 0, "Breakpoint prefixes go before the utility: md:flex."),
    tf("Tailwind ships every utility class to production whether you use it or not.", false,
      "Only classes found in your source files are generated."),
    fill("The utility for display: grid is ___.", "grid", "Display utilities are named after the value: block, flex, grid, hidden…"),
  ]),

  check("typescript", "TypeScript", [
    mc("What is the inferred type of x in let x = [1, 'a']?", ["(string | number)[]", "[number, string]", "any[]", "unknown"], 0,
      "Array literals infer a union element type, not a tuple. Use `as const` for a tuple."),
    tf("TypeScript types exist at runtime.", false, "Types are erased when compiling to JavaScript."),
    mc("Which check narrows value: string | number to string?", ["typeof value === 'string'", "value instanceof String", "value as string", "value!"], 0,
      "typeof guards narrow primitives. `as` just asserts. It doesn't check."),
  ]),

  check("react", "React", [
    mc("Which hook runs side effects after render?", ["useEffect", "useMemo", "useRef", "useState"], 0, "useEffect runs after the render is committed."),
    tf("To add an item, call items.push(x) and then setItems(items).", false,
      "Same array reference means React may skip the re-render. Create a new array: setItems([...items, x])."),
    fill("Items rendered with .map() need a unique ___ prop.", "key", "Keys let React match items between renders."),
  ]),

  check("nextjs", "Next.js", [
    mc("In the App Router, which file defines a route's UI?", ["page.tsx", "index.tsx", "route.tsx", "view.tsx"], 0,
      "page.tsx renders UI. route.tsx defines API handlers."),
    tf("App Router components are Server Components by default.", true, "Add \"use client\" to opt a component into the client."),
    mc("Which directive marks a client component?", ['"use client"', '"use browser"', "export const client = true", '"client only"'], 0,
      '"use client" at the top of the file.'),
  ]),

  // ───────────── Backend ─────────────
  check("nodejs", "Node.js", [
    mc("Which file lists a Node project's dependencies?", ["package.json", "node.config.js", "deps.txt", "npmfile"], 0, "package.json holds dependencies and scripts."),
    tf("Node runs your JavaScript on many threads by default.", false,
      "Your code runs on one thread with an event loop. I/O is handed off and completes asynchronously."),
    fill("You can only use await inside a function marked ___ (or at the top level of an ES module).", "async", "async functions return promises and can await."),
  ]),
  {
    id: "nodejs-1", skillId: "nodejs", type: "code", lang: "js",
    title: "Parse a Query String", description: "Write parseQuery(qs) turning 'a=1&b=two' into { a: '1', b: 'two' }.",
    difficulty: "beginner", xpReward: 50,
    starterCode: "function parseQuery(qs) {\n  \n}\n",
    hints: ["URLSearchParams is built in", "Object.fromEntries turns entries into an object"],
    tests: [js("parseQuery('a=1&b=two')", { a: "1", b: "two" }), js("parseQuery('')", {}), js("parseQuery('q=hello%20world')", { q: "hello world" })],
  },

  check("express", "Express", [
    mc("What does calling next() in middleware do?", ["Passes control to the next middleware", "Ends the response", "Restarts the server", "Skips every remaining route"], 0,
      "next() hands the request to the next matching middleware or route."),
    tf("Express error-handling middleware takes four arguments: (err, req, res, next).", true, "The four-argument signature is how Express recognises error handlers."),
    mc("With route '/users/:id', how do you read 42 from GET /users/42?", ["req.params.id", "req.query.id", "req.body.id", "req.id"], 0,
      "Path parameters live on req.params. req.query is for ?key=value."),
  ]),
  {
    id: "express-1", skillId: "express", type: "code", lang: "js",
    title: "Route Matcher", description: "Write matchRoute(pattern, path): return an object of params if it matches, otherwise null. matchRoute('/users/:id', '/users/42') → { id: '42' }.",
    difficulty: "intermediate", xpReward: 60,
    starterCode: "function matchRoute(pattern, path) {\n  \n}\n",
    hints: ["Split both on '/'", "Different segment counts means no match", "Segments starting with ':' capture a param"],
    tests: [
      js("matchRoute('/users/:id', '/users/42')", { id: "42" }),
      js("matchRoute('/users/:id/posts/:postId', '/users/7/posts/9')", { id: "7", postId: "9" }),
      js("matchRoute('/users/:id', '/teams/42')", null),
      js("matchRoute('/users/:id', '/users/42/extra')", null),
    ],
  },

  check("rest-apis", "REST APIs", [
    mc("Status code for a newly created resource?", ["201 Created", "200 OK", "204 No Content", "302 Found"], 0, "201 plus a Location header pointing at the new resource."),
    tf("GET requests should never change server state.", true, "GET is a safe method, so caches and crawlers may repeat it freely."),
    mc("Which verb replaces a resource entirely?", ["PUT", "PATCH", "POST", "GET"], 0, "PUT replaces. PATCH partially updates."),
  ]),

  check("sql", "SQL", [
    mc("Which clause filters groups after aggregation?", ["HAVING", "WHERE", "GROUP BY", "ORDER BY"], 0, "WHERE filters rows before grouping. HAVING filters groups after."),
    tf("An INNER JOIN keeps rows that have no match in the other table.", false, "That's an OUTER join. INNER keeps only matches."),
    fill("Remove duplicate rows with SELECT ___ …", "distinct", "SELECT DISTINCT collapses identical rows."),
  ]),

  check("postgres", "PostgreSQL", [
    mc("Which type stores JSON in a binary, indexable form?", ["jsonb", "json", "text", "hstore"], 0, "jsonb is parsed once and supports GIN indexes."),
    tf("A transaction applies all of its statements or none of them.", true, "That's atomicity, the A in ACID."),
    mc("What does Row Level Security control?", ["Which rows each user can read or write", "Which columns are indexed", "Disk encryption", "Replication lag"], 0,
      "RLS policies filter rows per user. This app uses them to keep your progress yours."),
  ]),

  check("auth", "Auth", [
    mc("How should passwords be stored?", ["Hashed with a slow algorithm like bcrypt or argon2", "Encrypted with AES", "Base64-encoded", "Plain text, since HTTPS protects them"], 0,
      "Slow, salted hashes make stolen databases expensive to crack. Encryption is reversible."),
    tf("Anyone holding a (non-encrypted) JWT can read its payload.", true, "JWTs are signed, not encrypted. Never put secrets in the payload."),
    mc("OAuth 2.0 is mainly a protocol for…", ["Delegated authorization", "Password hashing", "Encrypting databases", "Load balancing"], 0,
      "It lets an app act on your behalf without your password. OIDC adds identity on top."),
  ]),
  {
    id: "auth-1", skillId: "auth", type: "code", lang: "js",
    title: "Token Expiry", description: "Write isExpired(payload, nowMs). JWT `exp` is in seconds; nowMs is milliseconds. Expired when now ≥ exp.",
    difficulty: "beginner", xpReward: 50,
    starterCode: "function isExpired(payload, nowMs) {\n  \n}\n",
    hints: ["Convert exp to milliseconds (× 1000)", "Use >= so a token is expired exactly at exp"],
    tests: [js("isExpired({ exp: 100 }, 100000)", true), js("isExpired({ exp: 200 }, 100000)", false), js("isExpired({ exp: 100 }, 99999)", false)],
  },

  check("fastapi", "FastAPI", [
    mc("What does FastAPI use to validate request bodies?", ["Pydantic models", "Regular expressions", "SQLAlchemy", "Hand-written if statements"], 0,
      "Type-annotated Pydantic models validate and document your payloads."),
    tf("FastAPI serves interactive OpenAPI docs at /docs automatically.", true, "Swagger UI at /docs, ReDoc at /redoc."),
    fill("Declare an async endpoint with `___ def read_item(...)`.", "async", "async def lets the endpoint await I/O without blocking."),
  ]),

  // ───────────── Data & AI ─────────────
  check("python", "Python", [
    mc("What is len([1, [2, 3], 4])?", ["3", "4", "2", "Error"], 0, "The nested list counts as one element."),
    tf("Python lists are immutable.", false, "Lists are mutable. Tuples are immutable."),
    mc("Which of these creates a dict?", ["{'a': 1}", "['a', 1]", "('a', 1)", "{'a', 1}"], 0, "{'a', 1} (no colon) is a set."),
  ]),

  check("pandas", "pandas", [
    mc("Select rows where the age column is over 30:", ["df[df['age'] > 30]", "df.where(age > 30)", "df.filter(age > 30)", "df.select('age > 30')"], 0,
      "A boolean Series works as a row mask."),
    tf("df.dropna() modifies df in place by default.", false, "It returns a new DataFrame. Assign it or pass inplace=True."),
    mc("Mean salary per department?", ["df.groupby('dept')['salary'].mean()", "df.mean('dept')", "df.pivot('salary')", "df.agg('dept')"], 0,
      "Split-apply-combine: group, pick the column, aggregate."),
  ]),
  {
    id: "pandas-1", skillId: "pandas", type: "code", lang: "js",
    title: "Group By, by Hand", description: "Write groupMean(rows, key, field) returning { [group]: mean } — what df.groupby(key)[field].mean() does.",
    difficulty: "intermediate", xpReward: 60,
    starterCode: "function groupMean(rows, key, field) {\n  \n}\n",
    hints: ["Accumulate a sum and count per group", "Then divide sum by count for each group"],
    tests: [
      js("groupMean([{d:'a',s:10},{d:'a',s:20},{d:'b',s:5}], 'd', 's')", { a: 15, b: 5 }),
      js("groupMean([], 'd', 's')", {}),
    ],
  },

  check("data-viz", "Data Viz", [
    mc("Best chart for a trend over time?", ["Line chart", "Pie chart", "Scatter plot", "Treemap"], 0, "Time on the x-axis, a connected line shows the trend."),
    tf("Bar charts should start their value axis at zero.", true, "Bar length encodes value. A truncated axis exaggerates differences."),
    mc("Comparing 12 categories' share of a whole is clearest as…", ["A sorted bar chart", "A 12-slice pie chart", "A line chart", "A 3D pie chart"], 0,
      "People compare lengths far better than angles."),
  ]),

  check("ml-basics", "ML Basics", [
    mc("99% accuracy on training data, 60% on test data. This is…", ["Overfitting", "Underfitting", "Good generalisation", "Regularization"], 0,
      "The model memorised the training set instead of learning the pattern."),
    tf("It's fine to evaluate a model on the data it was trained on.", false, "Hold out a test set, or you're measuring memory, not skill."),
    mc("Predicting a house price is…", ["Regression", "Classification", "Clustering", "Reinforcement learning"], 0, "A continuous numeric target means regression."),
  ]),

  check("deep-learning", "Deep Learning", [
    mc("What does gradient descent minimize?", ["The loss function", "The number of layers", "The learning rate", "The dataset size"], 0,
      "It nudges weights against the gradient of the loss."),
    tf("Transformers rely on attention rather than recurrence.", true, "\"Attention Is All You Need\" (2017) dropped RNNs."),
    fill("Dense vector representations of words or items are called ___.", "embeddings", "Similar things end up close together in embedding space."),
  ]),

  check("llm-apps", "LLM Apps", [
    mc("RAG stands for…", ["Retrieval-Augmented Generation", "Recursive Answer Graph", "Random Attention Gradient", "Rapid API Gateway"], 0,
      "Retrieve relevant documents, then put them in the prompt."),
    tf("Lowering temperature makes output more deterministic.", true, "Low temperature favours the most likely tokens."),
    mc("Best way to know if a prompt change made your app better?", ["Run it against an eval set", "Try one example by hand", "Ask the model if it improved", "Make the prompt longer"], 0,
      "Evals turn \"feels better\" into a number you can track."),
  ]),

  // ───────────── DevOps & Cloud ─────────────
  check("git", "Git", [
    mc("Which command creates and switches to a new branch?", ["git switch -c feature", "git branch --go feature", "git commit -b feature", "git new feature"], 0,
      "git switch -c (or the older git checkout -b)."),
    tf("git pull is git fetch followed by a merge (or rebase).", true, "Fetch downloads, then pull integrates."),
    fill("Stage everything in the current directory with `git ___ .`", "add", "git add moves changes into the staging area."),
  ]),

  check("linux", "Linux", [
    mc("What does chmod 755 give the file's owner?", ["Read, write and execute", "Read only", "Execute only", "Nothing"], 0, "7 = 4 (r) + 2 (w) + 1 (x). Group and others get 5 = r-x."),
    tf("In `ls | grep log`, ls's output becomes grep's input.", true, "The pipe connects stdout to stdin."),
    fill("Print the current working directory with ___.", "pwd", "pwd = print working directory."),
  ]),

  check("docker", "Docker", [
    mc("An image is to a container as…", ["A class is to an instance", "A VM is to a disk", "A branch is to a commit", "A port is to a host"], 0,
      "Containers are running instances of an image."),
    tf("Files written inside a container survive `docker rm` by default.", false, "The container's writable layer is deleted. Use volumes for data."),
    mc("Why use multi-stage builds?", ["Smaller final images without build tools", "Faster network", "To run several OSes", "To avoid writing a Dockerfile"], 0,
      "Build in one stage, copy only the output into a slim runtime stage."),
  ]),

  check("ci-cd", "CI/CD", [
    mc("Where do GitHub Actions workflows live?", [".github/workflows/", ".ci/", ".git/hooks/", "actions/"], 0, "YAML files in .github/workflows/. This repo has one."),
    tf("CI means merging small changes often, verified by automated tests.", true, "Small, frequent, tested merges keep main releasable."),
    mc("A deploy breaks production. Usually the fastest safe move is…", ["Roll back to the last good release", "Debug live in production", "Delete the logs", "Turn off monitoring"], 0,
      "Restore service first, investigate second."),
  ]),

  check("kubernetes", "Kubernetes", [
    mc("The smallest deployable unit in Kubernetes is a…", ["Pod", "Node", "Container image", "Namespace"], 0, "A pod wraps one or more containers that share a network namespace."),
    tf("A Deployment keeps the desired number of replicas running.", true, "It reconciles actual state towards the declared replica count."),
    mc("What gives a set of pods a stable network address?", ["A Service", "A ConfigMap", "A Secret", "A Volume"], 0, "Pods come and go. The Service's address stays put."),
  ]),

  check("cloud", "Cloud", [
    mc("The rule for granting IAM permissions is…", ["Least privilege", "Admin for everyone", "Share the root credentials", "Grant everything, revoke later"], 0,
      "Give each identity only what it needs."),
    tf("Object storage like S3 is a good fit for user-uploaded images.", true, "Cheap, durable and served over HTTP. Keep blobs out of your database."),
    mc("Autoscaling adds capacity based on…", ["Load metrics like CPU or request rate", "The time zone", "Number of git commits", "Team size"], 0,
      "Scale policies watch metrics and add or remove instances."),
  ]),

  check("iac", "Terraform", [
    mc("What does terraform plan do?", ["Shows the changes it would make, without applying them", "Deletes infrastructure", "Writes provider code", "Formats files"], 0,
      "Always read the plan before you apply it."),
    tf("For teams, Terraform state belongs in a shared backend with locking.", true, "Otherwise two applies can race and corrupt state."),
    fill("Apply planned changes with `terraform ___`.", "apply", "terraform apply executes the plan."),
  ]),
];

export const challengeById = new Map(challenges.map((c) => [c.id, c]));
export const challengesForSkill = (skillId: string) => challenges.filter((c) => c.skillId === skillId);
