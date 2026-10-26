/* English text for quiz sets authored in Italian in Lesson.jsx.
   Keyed by quiz id, then by question index; each entry overrides q / options / why.
   `correct` stays in Lesson.jsx — option order must match the Italian one. */
export default {
  "regression": [
    { q: "An agent that runs for several customers gets customer A wrong. Where is the cause almost always?", options: ["In the agent's prompt, it has to be rewritten for A", "In the data extraction/normalisation step: the agent reasons fine on an input that was already corrupted upstream", "In the LLM, it has to be swapped"], why: "Garbage in, garbage out: the trace shows the agent receives bad data from the extraction step. You fix it there and parametrise per customer in config, without touching the agent's logic." },
    { q: "Why is it NOT a good idea to build a dedicated agent per customer?", options: ["It costs too much GPU", "After N customers you have N agents to maintain and every fix has to be replicated N times: it kills scalability and reusability", "LLMs don't allow it"], why: "Shared logic for everyone, differences in config (mapping, thresholds, per-pattern skills). It is also the FDE's success metric: how much of what you build for one customer is reusable for the others." },
    { q: "What is the safety net that catches the “fix for A breaks B” regression BEFORE production?", options: ["Testing by hand on the customer who complained", "A golden set per customer + an eval gate that blocks the deploy if a change makes anyone regress", "Waiting for customers to report the bugs"], why: "Each customer has a battery of real, already-judged cases; a change ships only if it passes them all. Every bug you find becomes a new test case, so it never silently regresses again." },
  ],
  "multitenancy": [
    { q: "Why does a B2B SaaS that wants to serve many customers almost always choose multi-tenant?", options: ["Because it is safer than single-tenant", "Because single-tenant needs a dedicated instance per customer: it doesn't scale and is too costly to maintain by hand", "Because single-tenant doesn't support SQL"], why: "Single-tenant = separate infrastructure for every customer: unsustainable beyond a few customers. Multi-tenant shares servers and DB, so a new customer costs almost nothing." },
    { q: "In the “shared schema + tenant_id” (pool) model, what does data isolation depend on?", options: ["On the physical separation of the databases", "On every query filtering by tenant_id — enforced by RLS, not left to the developer's memory", "On the network firewall"], why: "In the pool the data is physically mixed: isolation is only logical. Row Level Security applies the tenant_id filter on every access, so a forgotten WHERE doesn't cause a leak." },
    { q: "A regulated fintech startup: super-sensitive data but a startup budget. What's the senior answer?", options: ["Single-tenant only for everyone, security first", "Shared pool only, cost first", "Hybrid: pool + strict RLS as the default, a dedicated database (silo) for the big or heavily regulated enterprise"], why: "There's rarely a pure answer. The pool keeps costs low for the mass; the silo (dedicated DB) gives physical isolation and data residency to the few customers who demand it. You choose per customer tier." },
  ],
  "dsarray": [
    { q: "Why does searching for a value cost O(n) in an array but O(1) in a hash map?", options: ["The hash map computes from the key the index where the data sits, without scanning", "Arrays are written in a slower language", "The hash map keeps the data sorted"], why: "The hash function turns the key into a position: you go straight to the slot. The array has to compare element by element." },
    { q: "What makes a hash map degrade towards O(n)?", options: ["Too many distinct keys", "Many collisions: several keys land in the same bucket, which turns into a list", "Using strings as keys"], why: "When many keys collide in the same bucket, searching that bucket becomes linear again. That's why the map resizes as the load factor grows." },
  ],
  "dslist": [
    { q: "What is the advantage of a linked list over an array?", options: ["Faster access by index", "Inserting/removing a node you already hold costs O(1), without shifting the others", "It uses less memory"], why: "Since it isn't contiguous, you just re-stitch two pointers. The array has to shift all the following elements." },
    { q: "What can you NOT do well with a linked list?", options: ["Access the n-th element in O(1)", "Add at the head", "Walk it in order"], why: "To reach the n-th you have to follow the chain of pointers: O(n). Random access is the weak spot." },
  ],
  "dsstackqueue": [
    { q: "What is the difference between a stack and a queue?", options: ["The stack is faster", "Stack = LIFO (the last in comes out), queue = FIFO (the oldest comes out)", "The queue can't grow"], why: "Same collection, different exit policy: LIFO vs FIFO. That's the only difference that matters." },
    { q: "In Python, why not use list.pop(0) as a queue?", options: ["Because it raises an error", "Because it's O(n): it shifts all the elements; collections.deque is better", "Because it doesn't keep the order"], why: "Removing from the head of a list re-compacts the array (O(n)). deque is optimised for O(1) at both ends." },
  ],
  "dstree": [
    { q: "In a balanced BST, searching for a value costs…", options: ["O(n)", "O(log n), because at every node you discard half of the tree", "O(1)"], why: "The rule “smaller on the left, larger on the right” halves the space at every step, like binary search." },
    { q: "Which traversal of a BST returns the values in sorted order?", options: ["Pre-order", "In-order (left · root · right)", "Level-order BFS"], why: "Visiting left → node → right on a BST, the values come out in ascending order. It's free sorting." },
  ],
  "dsheap": [
    { q: "What does a min-heap guarantee?", options: ["All elements sorted", "Only that every parent is ≤ its children, so the minimum is always on top", "Finding any value in O(1)"], why: "The heap isn't fully sorted: it only keeps the parent≤children invariant, which is enough to give the minimum in O(1)." },
    { q: "To find the K largest elements, the heap saves you work because…", options: ["It sorts everything faster", "A heap of size K is enough: O(n log K) instead of sorting everything O(n log n)", "It uses no memory"], why: "You only keep the K candidates: for each new element you decide whether it gets in. There's no need to sort the whole set." },
  ],
  "dsgraph": [
    { q: "What is the only difference in code between traversing a tree and a graph?", options: ["The graph requires recursion", "You need a “visited” set so you don't revisit nodes and end up in an infinite loop", "A graph can't be done with BFS"], why: "Trees have no cycles; graphs do. Without the visited set, BFS/DFS would run forever." },
    { q: "You want the path with the fewest steps (unweighted edges). Which do you use?", options: ["DFS", "BFS: it explores in waves, so it finds the closest node first", "Union-Find"], why: "BFS visits in increasing levels of distance: the first way it reaches a node is the shortest." },
  ],
  "dstrie": [
    { q: "Why is the trie ideal for autocomplete?", options: ["It compresses the data", "Finding all words with a prefix costs O(length), regardless of how many words you have", "It's faster than a hash map for exact lookups"], why: "You follow the prefix branch and below it sit all the words sharing it: the cost depends on the length, not on the dictionary." },
    { q: "What is the downside of the trie?", options: ["It's slow to search", "It uses more memory (one node per letter of the branches)", "It can't handle strings"], why: "The trie trades memory for very fast prefix lookups. For small data it may not be worth it." },
  ],
  "dsunion": [
    { q: "What is Union-Find for?", options: ["Sorting elements", "Answering “are these two in the same group?” and “merge two groups” in nearly constant time", "Finding the minimum"], why: "Two operations: find (what's the root of the group?) and union (merge two groups). Perfect for components and cycles." },
    { q: "When does Union-Find beat BFS/DFS for counting groups?", options: ["Always", "When edges arrive one at a time and you want to answer “connected?” after each without redoing everything", "When the graph is small"], why: "Union-Find is incremental: you add a connection and stay up to date. BFS/DFS would redo the exploration every time." },
  ],
  "lcpattern": [
    { q: "What is the real skill in coding interviews?", options: ["Having memorised hundreds of problems", "Translating the problem statement into the right pattern by recognising the signals", "Writing code very fast"], why: "Almost all problems fall into ~10 patterns. The job is recognising from the text which one to use." },
    { q: "“Longest contiguous subarray with sum ≤ K”: which pattern?", options: ["Binary search", "Sliding window (a window that grows/shrinks)", "Backtracking"], why: "“Contiguous subarray + longest/best” is the classic sliding-window signal." },
  ],
  "lctwoptr": [
    { q: "The two-pointers pattern on an array requires that…", options: ["The array is sorted (or sortable)", "The array is small", "There are positive numbers"], why: "Moving the two indices based on a comparison only makes sense by exploiting the order. If it isn't sorted, you often need a hash map." },
    { q: "The sum of the two ends is too low compared to the target: what do you do?", options: ["Lower the right one", "Raise the left one (you need a bigger number)", "Start over"], why: "With a sorted array, moving the left pointer right increases the sum without trying every pair." },
  ],
  "lcsliding": [
    { q: "What makes the sliding window O(n)?", options: ["It sorts the data first", "Each element enters and leaves the window only once", "It uses recursion"], why: "l and r only move forward: overall each element is added and removed at most once." },
    { q: "When do you shrink the window from the left side?", options: ["At every step", "When the condition breaks (e.g. a repeated character, sum too large)", "Never"], why: "You widen with r while the condition holds; as soon as it breaks, you advance l to restore it." },
  ],
  "lcbinary": [
    { q: "Precondition of binary search?", options: ["Sorted data (or a monotonic yes/no condition)", "Numeric data", "An array of even size"], why: "Looking at the middle tells you which way to go only if there is an order/monotonicity. From there the halving: O(log n)." },
    { q: "What is “binary search on the answer”?", options: ["Searching twice", "Looking for the minimum/maximum value that satisfies a monotonic condition, not an element in the array", "A random search"], why: "When “works/doesn't work” is monotonic in the parameter, you binary-search the threshold. It's the advanced variant." },
  ],
  "lctraversal": [
    { q: "Why is “counting islands” in a matrix a graph problem?", options: ["Because the matrix is big", "Each cell is a node connected to its neighbours: you sink each island with BFS/DFS marking the visited cells", "DP is required"], why: "A grid is an implicit graph. Every time you find unvisited land, +1 island and you sink the whole region." },
    { q: "How do you avoid recounting the same cells?", options: ["With a timer", "You mark visited cells (on the grid itself or in a set)", "It can't be avoided"], why: "Marking visited cells is what breaks cycles and prevents counting the same island twice." },
  ],
  "lcbacktrack": [
    { q: "What is the backtracking template?", options: ["Sort · search · return", "Choose · explore (recurse) · undo the choice", "Divide · conquer · merge"], why: "You make a choice, recurse deeper, then undo it to try the alternative. It's DFS on the decision tree." },
    { q: "When is backtracking NOT the best choice?", options: ["When you must enumerate all the combinations", "When you only want “how many/the best” and the subproblems repeat: there DP wins", "With small inputs"], why: "Backtracking explores everything (exponential). If it's enough to count/optimise with repeated subproblems, DP is more efficient." },
  ],
  "lcdp": [
    { q: "What distinguishes a dynamic programming problem?", options: ["It has a lot of data", "It breaks down into subproblems that repeat, and memoising them avoids recomputation", "It requires recursion"], why: "The heart of DP is overlapping subproblems: you solve them once and reuse the result." },
    { q: "What must you define to set up a DP?", options: ["Only the base case", "The state (what dp[i] represents) and the transition (how it derives from the previous ones)", "The order in which nodes are visited"], why: "State + transition are the skeleton: what dp[i] captures and how you build it from the smaller cases." },
  ],
  "lcheap": [
    { q: "For the K LARGEST elements, which kind of heap do you use?", options: ["A max-heap of all the elements", "A min-heap of size K: you drop the minimum when it exceeds K", "No heap"], why: "Counterintuitive but true: with a min-heap of size K, the top is the “worst on the podium” to discard. The K best remain." },
    { q: "Why is the heap a good fit for streams?", options: ["It reads the future", "It keeps only K elements in memory: you don't need the whole set at once", "It sorts in zero time"], why: "On an endless stream you can't keep everything. A heap of size K uses constant memory." },
  ],
  "lcintervals": [
    { q: "First, almost automatic move with a list of intervals?", options: ["Sort them by start time", "Add up the lengths", "Find the longest"], why: "Sorted by start, you only need to compare each interval with the last active one: from O(n²) to O(n log n)." },
    { q: "Two intervals [a,b] and [c,d] (sorted by start) overlap if…", options: ["b < c", "c ≤ b (the second starts before the first ends)", "a == c"], why: "If the next one starts within the end of the previous one, they touch and must be merged by extending the end to the maximum." },
  ],
};
