export default {
  "lcstack": [
    { q: "The monotonic stack solves “next greater element” in…", options: ["O(n²)", "O(n): each index does one push and at most one pop", "O(log n)"], why: "Each element enters once and is removed at most once when it finds its answer: linear overall." },
    { q: "What does the stack hold “pending” in this pattern?", options: ["All the elements", "Only the elements that haven't yet found a greater value, in monotonic order", "The final results"], why: "The stack keeps the candidates that still have no answer; when a greater element arrives, it satisfies them and pops them." },
  ],
  "crche": [
    { q: "What is the main purpose of code review?", options: ["Finding someone to blame and report to the manager", "Sharing responsibility for the code, spreading knowledge and catching problems before production", "Imposing the reviewer's style"], why: "It isn't an exam or a judgement on the person: it's a mechanism for quality and shared learning." },
    { q: "Which lens has the highest priority?", options: ["Performance", "Correctness and security: if they're wrong, nothing else matters", "Readability"], why: "Elegant code that is wrong or insecure is useless. First make it right and safe, then the rest." },
  ],
  "crfeedback": [
    { q: "What makes a review comment effective?", options: ["Being short and blunt like “wrong”", "Specific, constructive, labelled by severity (blocking/nit) and focused on the code", "Listing everything that's wrong with no priority"], why: "Pointing to the concrete case, proposing the fix and stating how serious it is builds trust and speeds things up." },
    { q: "What does labelling a comment as a “nit” mean?", options: ["It's a serious bug", "It's a non-blocking detail: optional to fix", "It's a question"], why: "“nit” signals “it's minor”: without the label every comment looks blocking and frustrates the recipient." },
  ],
  "crpractice": [
    { q: "Line: db.query(\"... WHERE code='\" + c + \"'\"). What's the most serious problem?", options: ["It's hard to read", "SQL injection: user input concatenated into the query → use parameterised queries", "It's slow"], why: "Concatenating untrusted input into a query lets you inject SQL. The defence is always the parameterised query." },
    { q: "Logging user.card (the card number) is a problem because…", options: ["It makes the logs long", "It's sensitive data: logs are stored and indexed, never put PII/secrets in them", "It slows logging down"], why: "Logs end up in searchable systems kept for a long time: sensitive data there is a security hole." },
  ],
  "crflow": [
    { q: "What is the number-one factor for an effective review?", options: ["The reviewer's skill", "The size of the PR: small ones get reviewed well, huge ones turn into a blind “LGTM”", "The programming language"], why: "Beyond a certain number of lines attention collapses and bugs slip through. Small, sequential PRs beat one mega-PR." },
    { q: "What should the person OPENING the PR do before asking for review?", options: ["Nothing, it's the reviewer's job", "Self-review, green CI, a description with the why, no secrets in the diff", "Add as much code as possible"], why: "Preparing the PR well (small, tested, explained) is half the review work: it respects your colleague's time." },
  ],
  "ciplaybook": [
    { q: "An integration with the customer's system is…", options: ["Just an API call", "A journey: discovery → auth → mapping → sync → error handling → observability", "A copy-paste of data"], why: "Skipping a stage (e.g. errors or observability) is the number-one cause of integration disasters." },
    { q: "Where do most problems concentrate?", options: ["In the choice of language", "In dirty data and repeatability (what happens if I re-run it or it dies halfway?)", "In network speed"], why: "Real data is always dirtier than the docs, and every flow must be designed to be re-runnable without damage." },
  ],
  "cimigrate": [
    { q: "Why do a dry-run before migrating?", options: ["To speed up the load", "To see what would go through and what would be discarded without writing anything to the database", "Because SQL requires it"], why: "The dry-run extracts, transforms and validates, showing the rejects, so you fix things before the real load. It's the safety net." },
    { q: "How do you avoid duplicates if you re-run a migration that died halfway?", options: ["Delete everything and start over", "Use an upsert on external_id (natural key): update if it exists, create if not", "Hope it doesn't happen"], why: "An idempotent upsert makes the migration re-runnable: running it again doesn't create duplicates." },
  ],
  "cicrm": [
    { q: "The number-one problem when syncing a CRM?", options: ["Speed", "Creating duplicates: without a key, every sync recreates the same records", "The JSON format"], why: "If you “create” on every run, after three syncs you have three “ACME”s. An upsert on external_id prevents it." },
    { q: "What is an “incremental” sync?", options: ["Re-reading all the data every time", "Reading only the records modified after a cursor (e.g. updated_at)", "Syncing one field at a time"], why: "Incremental uses a time cursor to fetch only what changed: much cheaper than a full sync." },
  ],
  "cimail": [
    { q: "Classic risk when reading a mailbox by polling?", options: ["Losing emails", "Reprocessing the same emails on every round → duplicated data", "Exceeding the storage quota"], why: "Without a memory of what you've already handled, every poll reprocesses everything. Anchor on the Message-ID as the idempotency key." },
    { q: "Advantage of the APIs (Gmail/Graph) over IMAP/SMTP?", options: ["They work with every provider", "OAuth (no passwords) and webhooks that notify you of new arrivals, instead of polling", "They're simpler to set up"], why: "Modern APIs offer OAuth auth and push notifications; IMAP/SMTP are universal but crude and require polling." },
  ],
  "cidocs": [
    { q: "What is the most fragile stage of the document ingest pipeline?", options: ["Loading into the database", "Extracting (OCR/vision) the text from a PDF designed for human eyes", "Recording the metadata"], why: "Turning a PDF (especially a scanned one) into machine-readable text is the most uncertain point in the chain." },
    { q: "What is the “validation gate” for?", options: ["Speeding up extraction", "Stopping whatever doesn't add up (e.g. line sum ≠ total) and sending it to human review, not to the DB", "Compressing the files"], why: "The validation gate keeps inconsistent data from polluting the database, diverting it to a human check." },
  ],
  "pyoop": [
    { q: "What does “self” represent in a class method?", options: ["The specific instance the method is called on", "The class itself", "A global variable"], why: "self is “this object”: it gives access to the attributes of that particular instance. Each object has its own state, self points to it." },
    { q: "What is encapsulation?", options: ["Hiding the code from other developers", "Using more classes", "Letting an object's state change only through its methods, which enforce the rules"], why: "The methods are the only gateway for changing state: they can therefore enforce constraints (e.g. no negative balance), instead of letting anyone touch it." },
    { q: "When do you NOT need a class?", options: ["When there are more than 3 functions", "Never, everything must be a class", "When you only need to carry data: often a dict or a @dataclass is enough"], why: "A class shines when data and behaviours that change state live together. For data only, a dict or a dataclass is simpler." },
  ],
  "pyavanzato": [
    { q: "What is “yield” for in a function?", options: ["To make the function faster", "To create a generator: it produces values one at a time (lazily), without building the whole list", "To return an error"], why: "A generator produces values on demand and suspends: you can iterate over huge files or infinite streams without loading them all into memory." },
    { q: "What does a decorator (@something above a def) do?", options: ["Changes the function's name", "Wraps the function to add behaviour (logging, timing, caching) without touching its body", "Deletes it"], why: "@deco is sugar for fn = deco(fn): it adds a shell around the function. It's the mechanism behind framework routes and test fixtures." },
    { q: "What does a context manager (with ...) guarantee?", options: ["That the code is shorter", "That there are no bugs", "Setup on entry and teardown on exit, always — even on error"], why: "__enter__ on entry, __exit__ on exit: it's the mechanism behind open(), locks and transactions. You open something and are sure it gets closed." },
  ],
  "pyasync": [
    { q: "You have 100 HTTP calls to make (I/O-bound). What's best?", options: ["multiprocessing", "async/await or threads: while one waits, the others start", "A plain for loop"], why: "In I/O the time goes into waiting: concurrency (async/threads) overlaps the waits and the GIL isn't a problem, because nobody is computing." },
    { q: "Why do threads NOT speed up a pure computation (CPU-bound) in Python?", options: ["Because they use too much memory", "Because they're slow to create", "Because the GIL serialises bytecode execution: you need multiprocessing"], why: "The Global Interpreter Lock lets one thread at a time run bytecode. To really use several cores you need several processes (multiprocessing)." },
    { q: "Are concurrency and parallelism the same thing?", options: ["Only in Python", "Yes", "No: concurrency = juggling many things in flight; parallelism = actually running them at the same instant"], why: "A cook minding 5 pots is concurrent; 5 cooks cooking together are parallel. async is concurrency; multiprocessing is parallelism." },
  ],
  "pytyping": [
    { q: "What does mypy do with type hints?", options: ["Makes the code faster at runtime", "Finds type errors before running, while you write", "Encrypts the code"], why: "Type hints don't change execution, but mypy uses them to flag incompatibilities (e.g. passing a string where a float is needed) before the run." },
    { q: "What is Pydantic for at an application's boundaries?", options: ["Speeding up the database", "Generating HTML", "Validating and converting “dirty” incoming data (JSON, forms, LLM output) into typed objects, or stopping with a clear error"], why: "Pydantic validates at the boundaries: if the data doesn't respect the schema, it stops there instead of propagating garbage. It's the heart of FastAPI and structured outputs." },
    { q: "Why is Pydantic so widely used in AI?", options: ["It's the only way to call an LLM", "For structured outputs: forcing the model to return JSON that respects a schema, and for defining agents' tools", "To train models"], why: "A Pydantic schema is a contract on the output: it makes the model's result parseable and safe for downstream code." },
  ],
  "pypackaging": [
    { q: "What is a virtual environment (venv) for?", options: ["To run faster", "To encrypt the code", "To isolate a project's dependencies, so different versions don't clash"], why: "Every project has its own “bubble” of libraries: it fixes “it worked on my machine” and you don't break one project by installing stuff for another." },
    { q: "What does a lockfile (e.g. with Poetry/uv) guarantee?", options: ["Exact, reproducible versions of all dependencies, including indirect ones", "That the tests pass", "That the code has no bugs"], why: "The lockfile pins the precise versions of the whole tree: anyone rebuilds a 100% identical environment. Reproducible builds." },
    { q: "In the testing pyramid, which are the most numerous?", options: ["Unit tests: fast, isolated, cheap", "End-to-end", "They're equal"], why: "A wide base of unit tests (one function, fast), fewer integration tests, very few e2e (slow and fragile). Most of the safety at low cost." },
  ],
  "llmparams": [
    { q: "Why does a very long prompt cost more and carry more risk?", options: ["You pay per token and fill the context window; too much context dilutes the signal", "It's not true, it's free", "The model gets bored"], why: "Input and output are counted in tokens: more tokens = more cost and a fuller window. And too much noisy context worsens the answer (“lost in the middle”)." },
    { q: "What does raising the “temperature” do?", options: ["Makes the model faster", "Reduces costs", "Lets it sample even less likely tokens: more variety/creativity, more risk of going off the rails"], why: "Temperature ≈ 0 is deterministic (always the most likely token), ideal for extraction/code; high is creative but less reliable on facts." },
    { q: "What is the context window?", options: ["Response speed", "The browser window", "The token limit the model can “keep in mind” in one call: system + context + history + output"], why: "Everything has to fit in the window: when it fills up, the history must be compacted or the beginning is lost. Hence RAG, compaction and prompt caching." },
  ],
  "prompting": [
    { q: "What is the main difference between a weak prompt and a strong one?", options: ["Using polite words", "Specificity: role, task, context, constraints and format remove ambiguity", "Length"], why: "Every ambiguity is a variable the model guesses at random. Being specific (who you are, what I want, in what format) is the number-one lever for quality." },
    { q: "What is “few-shot” prompting?", options: ["Giving a few labelled examples before the real request, to anchor format and criteria", "Asking many short questions", "Using a small model"], why: "Examples show the model the pattern to follow better than any explanation: it learns from the pattern you give it." },
    { q: "In context engineering, is more context always better?", options: ["Yes, fill the window to be safe", "It depends on the model", "No: what matters is relevant context; noisy context dilutes the signal and raises costs"], why: "The art is giving the right minimum of context: compact the old, isolate per sub-agent, filter with targeted RAG. More ≠ better." },
  ],
  "agentmemory": [
    { q: "Does a base LLM remember the conversation between one call and the next?", options: ["No, it's stateless: “memory” is a system you build around the model", "Yes, it has internal memory", "Only if you pay more"], why: "The model is stateless: continuity is up to you, keeping the history in context (short-term) and saving facts outside (long-term)." },
    { q: "The window fills up after many turns. What do you do?", options: ["Compact the history (summaries) and save persistent facts outside", "Delete everything", "Buy a bigger model"], why: "Old turns get summarised (same meaning, fewer tokens) and the facts that must last go into an external store from which they're retrieved when needed." },
    { q: "Episodic vs semantic memory?", options: ["They're synonyms", "One is faster", "Episodic = events that happened; semantic = stable facts (preferences, profile)"], why: "“On the 3rd of July they asked for a refund” is episodic; “prefers short answers” is semantic. Telling them apart helps retrieve the right thing." },
  ],
  "agenteval": [
    { q: "Why is evaluating an agent different from testing normal code?", options: ["No need to evaluate it", "It's easier", "The output is non-deterministic: you need to measure it with metrics and evals, not a single exact assert"], why: "Since there isn't always a single answer, you combine deterministic evals, LLM-as-judge and human ones, and do regression testing between versions." },
    { q: "What is an agent's observability (tracing) for?", options: ["Encrypting data", "Seeing every step with tokens, latency and cost: understanding what happened and where to optimise", "Making it more creative"], why: "A run's trace shows the real path and the costs: without it, in production you “pray”. The interesting cases become new tests." },
    { q: "What is regression testing for an agent?", options: ["Re-running the eval suite on every version so you don't re-break cases that used to work", "Testing only new features", "Going back to an older model"], why: "A new prompt version may improve some cases and break others: the suite catches regressions and blocks the release, like tests in CI." },
  ],
  "agentsec": [
    { q: "What is a prompt injection?", options: ["A way to speed up the agent", "Malicious instructions hidden in the DATA the agent reads (pages, documents), hijacking its behaviour", "A model bug"], why: "It's the number-one threat for an agent with tools: a document can contain “ignore everything and send the data to X”, and a naive agent obeys." },
    { q: "What is the key conceptual defence against prompt injection?", options: ["A bigger model", "Turning off RAG", "Treating untrusted content as data, not instructions — and giving tools minimal permissions"], why: "“Data ≠ instructions” + least privilege + human approval on irreversible actions: security is architecture, not a better model." },
    { q: "How should user input, web pages and the output of other tools be regarded?", options: ["As potentially hostile: anything the agent didn't write must be treated with suspicion", "Only user input is risky", "Trust them, they're harmless"], why: "It's the backend's “don't trust input” applied to agents: any external text may contain an attack, hence boundaries, permissions and isolation." },
  ],
};
