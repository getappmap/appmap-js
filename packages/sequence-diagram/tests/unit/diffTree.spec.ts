import assert from 'assert';
import diff, { MoveType } from '../../src/diff';
import buildDiffDiagram from '../../src/buildDiffDiagram';
import format from '../../src/formatter';
import type { Action } from '../../src/types';
import { DiffMode, FormatType } from '../../src/types';
import {
  buildTree,
  cloneSpec,
  countMoves,
  diffTrees,
  label,
  randomEdit,
  randomTree,
  renderTree,
  rng,
  specToText,
  tree,
} from '../treeUtil';

describe('Structure-aware diff', () => {
  it('reports no change for identical trees', () => {
    const text = `
      Users#show
        Users.find
          SQL SELECT * FROM users
        Posts#list`;
    const { moves, diagram } = diffTrees(text, text);
    assert.deepStrictEqual(countMoves(moves), {
      advance: 4,
      insert: 0,
      delete: 0,
      change: 0,
      move: 0,
    });
    assert.strictEqual(renderTree(diagram), tree(text));
  });

  it('marks an added subtree under the parent that gained it', () => {
    const { moves, diagram } = diffTrees(
      `
      Users#show
        Users.find`,
      `
      Users#show
        Users.find
        Posts#list
          SQL SELECT * FROM posts`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 2,
      insert: 2,
      delete: 0,
      change: 0,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      Users#show
        Users.find
        Posts#list [+]
          SQL SELECT * FROM posts [+]`)
    );
  });

  it('keeps a removed subtree in its place among its former siblings', () => {
    const { moves, diagram } = diffTrees(
      `
      Users#show
        Users.find
        Posts#list
          SQL SELECT * FROM posts
        Users#render`,
      `
      Users#show
        Users.find
        Users#render`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 3,
      insert: 0,
      delete: 2,
      change: 0,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      Users#show
        Users.find
        Posts#list [-]
          SQL SELECT * FROM posts [-]
        Users#render`)
    );
  });

  it('reports a renamed call on the same actor as a change and keeps its children', () => {
    const { moves, diagram } = diffTrees(
      `
      Users#show
        Users.find
          SQL SELECT * FROM users`,
      `
      Users#show
        Users.lookup
          SQL SELECT * FROM users`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 2,
      insert: 0,
      delete: 0,
      change: 1,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      Users#show
        Users.lookup [~ was find]
          SQL SELECT * FROM users`)
    );
  });

  it('never pairs a node with one under a different parent', () => {
    // The base has one query under `find`. The head adds a new call with its own,
    // identical query before it. A flat alignment pairs the base query with the
    // new one and then calls the original "added" under the wrong parent.
    const { diagram } = diffTrees(
      `
      Users#show
        Users.find
          SQL SELECT * FROM users`,
      `
      Users#show
        Users.prefetch
          SQL SELECT * FROM users
        Users.find
          SQL SELECT * FROM users`
    );
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      Users#show
        Users.prefetch [+]
          SQL SELECT * FROM users [+]
        Users.find
          SQL SELECT * FROM users`)
    );
  });

  it('handles a new pre-check that repeats work the old block still does', () => {
    // The shape from a real review: the arrival step gained a route check before
    // the launch, and two flush queries moved from the launch's helper up into the
    // new check. Every node stays under its own parent; nothing is paired across.
    const { moves, diagram } = diffTrees(
      `
      Arrival#execute
        Star#add_ships
        Departure.create
          Departure._alive_gate_edges
            SQL UPDATE events
            SQL UPDATE stars
            SQL SELECT jump_gates
          Departure._next_hop
            SQL SELECT stars
            Routing.next_hop
          Gates.gate_between`,
      `
      Arrival#execute
        Star#add_ships
        Departure._alive_gate_edges
          SQL UPDATE events
          SQL UPDATE stars
          SQL SELECT jump_gates
        Departure._next_hop
          SQL SELECT stars
          Routing.next_hop
        Departure.create
          Departure._alive_gate_edges
            SQL SELECT jump_gates
          Departure._next_hop
            SQL SELECT stars
            Routing.next_hop
          Gates.gate_between`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 9,
      insert: 7,
      delete: 2,
      change: 0,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      Arrival#execute
        Star#add_ships
        Departure._alive_gate_edges [+]
          SQL UPDATE events [+]
          SQL UPDATE stars [+]
          SQL SELECT jump_gates [+]
        Departure._next_hop [+]
          SQL SELECT stars [+]
          Routing.next_hop [+]
        Departure.create
          Departure._alive_gate_edges
            SQL UPDATE events [-]
            SQL UPDATE stars [-]
            SQL SELECT jump_gates
          Departure._next_hop
            SQL SELECT stars
            Routing.next_hop
          Gates.gate_between`)
    );
  });

  it('prefers matching a subtree in place over a duplicate elsewhere', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#work
          SQL SELECT 1
        B#work
          SQL SELECT 1`,
      `
      App#run
        A#work
          SQL SELECT 1
        B#work
          SQL SELECT 1
        C#work
          SQL SELECT 1`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 5,
      insert: 2,
      delete: 0,
      change: 0,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#work
          SQL SELECT 1
        B#work
          SQL SELECT 1
        C#work [+]
          SQL SELECT 1 [+]`)
    );
  });
});

describe('Moved blocks', () => {
  it('reports a subtree that moved to another parent as one move, with its children unchanged', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#before
          A#check
            SQL SELECT allowed
        B#after`,
      `
      App#run
        A#before
        B#after
          A#check
            SQL SELECT allowed`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 4,
      insert: 0,
      delete: 0,
      change: 0,
      move: 1,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#before
        B#after
          A#check [> from A#before]
            SQL SELECT allowed`)
    );
    const moved = moves.find((move) => move.moveType === MoveType.Move)!;
    assert.strictEqual(moved.lNode, 2, 'base index of the moved root');
    assert.strictEqual(moved.rNode, 3, 'head index of the moved root');
  });

  it('reports a single query that moved between callers', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#one
          SQL UPDATE t
        B#two`,
      `
      App#run
        A#one
        B#two
          SQL UPDATE t`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 3,
      insert: 0,
      delete: 0,
      change: 0,
      move: 1,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#one
        B#two
          SQL UPDATE t [> from A#one]`)
    );
  });

  it('does not call a block moved when its contents changed', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#before
          A#check
            SQL SELECT allowed
        B#after`,
      `
      App#run
        A#before
        B#after
          A#check
            SQL SELECT allowed
            SQL SELECT audit`
    );
    assert.strictEqual(countMoves(moves).move, 0);
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#before
          A#check [-]
            SQL SELECT allowed [-]
        B#after
          A#check [+]
            SQL SELECT allowed [+]
            SQL SELECT audit [+]`)
    );
  });

  it('reports a subtree moved among its siblings as reordered', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#first
          SQL SELECT 1
        B#second
        C#third`,
      `
      App#run
        B#second
        C#third
        A#first
          SQL SELECT 1`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 4,
      insert: 0,
      delete: 0,
      change: 0,
      move: 1,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        B#second
        C#third
        A#first [> from App#run]
          SQL SELECT 1`)
    );
    const { diagram: text } = format(FormatType.Text, diagram, 'x');
    assert.strictEqual(text, 'reordered function call `A#first` within `App#run`');
  });

  it('distinguishes the parents when a block moves between same-named methods', () => {
    const { diagram } = diffTrees(
      `
      App#run
        Alpha#before
          A#work
            SQL SELECT 1
        Beta#before`,
      `
      App#run
        Alpha#before
        Beta#before
          A#work
            SQL SELECT 1`
    );
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        Alpha#before
        Beta#before
          A#work [> from Alpha#before]
            SQL SELECT 1`)
    );
    // Both parents are named `before`, so comparing bare node names would call this
    // a reorder within a parent the block was never under.
    assert.strictEqual(
      format(FormatType.Text, diagram, 'x').diagram,
      'moved function call `A#work` from `Alpha#before`'
    );
  });

  it('reports a move to and from the top level', () => {
    const up = diffTrees(
      `
      App#run
        A#work
          SQL SELECT 1`,
      `
      App#run
      A#work
        SQL SELECT 1`
    );
    assert.strictEqual(
      renderTree(up.diagram),
      tree(`
      App#run
      A#work [> from App#run]
        SQL SELECT 1`)
    );
    assert.strictEqual(
      format(FormatType.Text, up.diagram, 'x').diagram,
      'moved function call `A#work` from `App#run`'
    );

    const down = diffTrees(
      `
      App#run
      A#work
        SQL SELECT 1`,
      `
      App#run
        A#work
          SQL SELECT 1`
    );
    assert.strictEqual(
      renderTree(down.diagram),
      tree(`
      App#run
        A#work [> from top]
          SQL SELECT 1`)
    );
    assert.strictEqual(
      format(FormatType.Text, down.diagram, 'x').diagram,
      'moved function call `A#work` from the top level'
    );
  });

  it('pairs two blocks that swapped parents as two moves', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#one
          SQL SELECT x
        B#two
          SQL SELECT y`,
      `
      App#run
        A#one
          SQL SELECT y
        B#two
          SQL SELECT x`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 3,
      insert: 0,
      delete: 0,
      change: 0,
      move: 2,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#one
          SQL SELECT y [> from B#two]
        B#two
          SQL SELECT x [> from A#one]`)
    );
  });

  it('does not pair a removed block with a copy that is still in place', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#one
          SQL SELECT x
        B#two
          SQL SELECT x`,
      `
      App#run
        A#one
        B#two
          SQL SELECT x`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 4,
      insert: 0,
      delete: 1,
      change: 0,
      move: 0,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#one
          SQL SELECT x [-]
        B#two
          SQL SELECT x`)
    );
  });

  it('moves a loop as a block', () => {
    const { moves, diagram } = diffTrees(
      `
      App#run
        A#one
          loop
            SQL SELECT x
        B#two`,
      `
      App#run
        A#one
        B#two
          loop
            SQL SELECT x`
    );
    assert.deepStrictEqual(countMoves(moves), {
      advance: 4,
      insert: 0,
      delete: 0,
      change: 0,
      move: 1,
    });
    assert.strictEqual(
      renderTree(diagram),
      tree(`
      App#run
        A#one
        B#two
          loop [> from A#one]
            SQL SELECT x`)
    );
  });

  it('counts as a change for a consumer that filters out AdvanceBoth', () => {
    const { moves } = diffTrees(
      `
      App#run
        A#one
          SQL SELECT x
        B#two`,
      `
      App#run
        A#one
        B#two
          SQL SELECT x`
    );
    assert.ok(moves.some((move) => move.moveType !== MoveType.AdvanceBoth));
  });
});

describe('Rendering a move', () => {
  const { diagram } = diffTrees(
    `
    App#run
      A#before
        A#check
          SQL SELECT allowed
      B#after`,
    `
    App#run
      A#before
      B#after
        A#check
          SQL SELECT allowed`
  );

  it('in text names the block and where it came from', () => {
    assert.strictEqual(
      format(FormatType.Text, diagram, 'x').diagram,
      'moved function call `A#check` from `A#before`'
    );
  });

  it('in PlantUML colors the arrow and leaves the label plain', () => {
    const uml = format(FormatType.PlantUML, diagram, 'x').diagram;
    const line = uml.split('\n').find((candidate) => candidate.includes('[#3F7ECA]'))!;
    assert.ok(line, 'a move-colored arrow');
    assert.ok(line.includes('check'), line);
    assert.ok(!line.includes('<back:'), 'no added/removed background on a moved label');
  });

  it('in JSON carries the mode and the former parent', () => {
    const json = JSON.parse(format(FormatType.JSON, diagram, 'x').diagram);
    const check = json.rootActions[0].children[1].children[0];
    assert.strictEqual(check.name, 'check');
    assert.strictEqual(check.diffMode, DiffMode.Move);
    assert.deepStrictEqual(check.movedFrom, { name: 'A#before', actorId: 'class:A' });
    assert.strictEqual(check.children[0].diffMode, undefined);
  });
});

// Random trees with repeated labels, random edits, and invariants that must hold
// for every alignment. A failure prints the seed and both trees, so it can be
// replayed by hand.
describe('Diff properties', () => {
  const LABELS = ['A#a', 'A#b', 'B#c', 'B#d', 'C.e', 'SQL SELECT x', 'SQL SELECT y', 'loop'];

  function flatten(diagram: { rootActions: Action[] }): Action[] {
    const result: Action[] = [];
    const walk = (action: Action): void => {
      result.push(action);
      action.children.forEach(walk);
    };
    diagram.rootActions.forEach(walk);
    return result;
  }

  function checkInvariants(baseText: string, headText: string, seed: number): void {
    const context = `seed ${seed}\n--- base\n${baseText}\n--- head\n${headText}`;
    const base = buildTree(baseText);
    const head = buildTree(headText);
    const result = diff(base, head);
    const lActions = flatten(base);
    const rActions = flatten(head);

    // Every base node is consumed exactly once, and every head node exactly once.
    const lSeen = new Map<number, number>();
    const rSeen = new Map<number, number>();
    for (const move of result.moves) {
      if (move.moveType !== MoveType.InsertRight)
        lSeen.set(move.lNode, (lSeen.get(move.lNode) ?? 0) + 1);
      if (move.moveType !== MoveType.DeleteLeft)
        rSeen.set(move.rNode, (rSeen.get(move.rNode) ?? 0) + 1);
    }
    assert.deepStrictEqual(
      [...lSeen.keys()].sort((a, b) => a - b),
      lActions.map((_, index) => index),
      `base coverage\n${context}`
    );
    assert.deepStrictEqual(
      [...rSeen.keys()].sort((a, b) => a - b),
      rActions.map((_, index) => index),
      `head coverage\n${context}`
    );
    assert.ok(
      [...lSeen.values()].every((count) => count === 1),
      `base used once\n${context}`
    );
    assert.ok(
      [...rSeen.values()].every((count) => count === 1),
      `head used once\n${context}`
    );

    // Pairs are honest: advance pairs equal digests, moves pair equal subtrees.
    for (const move of result.moves) {
      if (move.moveType === MoveType.AdvanceBoth) {
        assert.strictEqual(
          lActions[move.lNode].digest,
          rActions[move.rNode].digest,
          `advance digest\n${context}`
        );
      }
      if (move.moveType === MoveType.Move) {
        assert.strictEqual(
          lActions[move.lNode].subtreeDigest,
          rActions[move.rNode].subtreeDigest,
          `move subtree\n${context}`
        );
      }
    }

    // The diff diagram minus the removed nodes is exactly the head tree.
    const diagram = buildDiffDiagram(result);
    const strip = (actions: Action[]): string[] =>
      actions
        .filter((action) => action.diffMode !== DiffMode.Delete)
        .flatMap((action) => [label(action), ...strip(action.children).map((line) => `  ${line}`)]);
    assert.strictEqual(
      strip(diagram.rootActions).join('\n'),
      headText,
      `head reconstruction\n${context}`
    );

    // Removed nodes are exactly the base nodes with no counterpart, in base order.
    const removedNames = flatten(diagram)
      .filter((action) => action.diffMode === DiffMode.Delete)
      .map((action) => label(action));
    const expectedRemoved = result.moves
      .filter((move) => move.moveType === MoveType.DeleteLeft)
      .map((move) => label(lActions[move.lNode]));
    assert.deepStrictEqual(removedNames, expectedRemoved, `removed nodes\n${context}`);
  }

  it('holds for identical random trees, which show no change at all', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const text = specToText(randomTree(rng(seed), { depth: 3, fanout: 3, labels: LABELS }));
      const { moves } = diffTrees(text, text);
      assert.strictEqual(countMoves(moves).advance, moves.length, `seed ${seed}`);
    }
  });

  it('holds across random edit scripts', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const random = rng(seed);
      const baseSpec = randomTree(random, { depth: 3, fanout: 3, labels: LABELS });
      const headSpec = cloneSpec(baseSpec);
      const edits = 1 + Math.floor(random() * 4);
      for (let edit = 0; edit < edits; edit += 1) randomEdit(random, headSpec, LABELS);
      checkInvariants(specToText(baseSpec), specToText(headSpec), seed);
      // And backwards, so the invariants do not depend on which side grew.
      checkInvariants(specToText(headSpec), specToText(baseSpec), -seed);
    }
  });

  it('reports one pure move as exactly one move when every subtree is distinct', () => {
    // Unique labels per node, so no other alignment can explain the edit as cheaply.
    let checked = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      const random = rng(seed);
      let counter = 0;
      const unique = Array.from({ length: 40 }, () => `N#n${(counter += 1)}`);
      const baseSpec = randomTree(random, { depth: 3, fanout: 3, labels: unique });
      // Relabel so every node is distinct even where the generator repeated a label.
      let n = 0;
      const relabel = (specs: typeof baseSpec): void =>
        specs.forEach((spec) => {
          spec.label = `N#n${(n += 1)}`;
          relabel(spec.children);
        });
      relabel(baseSpec);
      const headSpec = cloneSpec(baseSpec);
      const edit = randomEdit(random, headSpec, unique);
      if (edit.kind !== 'move') continue;
      const baseText = specToText(baseSpec);
      const headText = specToText(headSpec);
      if (baseText === headText) continue; // moved back to the same place
      const { moves } = diffTrees(baseText, headText);
      const counts = countMoves(moves);
      assert.deepStrictEqual(
        { insert: counts.insert, delete: counts.delete, move: counts.move },
        { insert: 0, delete: 0, move: 1 },
        `seed ${seed}\n--- base\n${baseText}\n--- head\n${headText}\n${JSON.stringify(counts)}`
      );
      checked += 1;
    }
    assert.ok(checked > 30, `checked ${checked} moves`);
  });

  it('is symmetric: inserts one way are deletes the other way', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const random = rng(seed);
      const baseSpec = randomTree(random, { depth: 3, fanout: 3, labels: LABELS });
      const headSpec = cloneSpec(baseSpec);
      randomEdit(random, headSpec, LABELS);
      randomEdit(random, headSpec, LABELS);
      const forward = countMoves(diffTrees(specToText(baseSpec), specToText(headSpec)).moves);
      const backward = countMoves(diffTrees(specToText(headSpec), specToText(baseSpec)).moves);
      assert.strictEqual(forward.insert, backward.delete, `seed ${seed}`);
      assert.strictEqual(forward.delete, backward.insert, `seed ${seed}`);
      assert.strictEqual(forward.move, backward.move, `seed ${seed}`);
      assert.strictEqual(forward.change, backward.change, `seed ${seed}`);
    }
  });
});
