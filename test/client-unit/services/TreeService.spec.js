/* global inject */

/**
 * TODO(@jniles) - this is a repeat of the server unit tests for the tree
 * service.  Ideally, we should use @ima-worldhealth/tree for both the client
 * and the server.
 */

describe('test/client-unit/services/TreeService', () => {
  beforeEach(module(
    'bhima.services',
  ));

  let tree;
  let Tree;

  const nodes = [{
    id : 1,
    parent : 0,
  }, {
    id : 2,
    parent : 1,
  }, {
    id : 3,
    parent : 6,
    valueA : 10,
    valueB : 2,
  }, {
    id : 4,
    parent : 0,
    valueA : 30,
    valueB : 4,
  }, {
    id : 5,
    parent : 2,
    valueA : 9,
    valueB : 7,
  }, {
    id : 6,
    parent : 0,
  }, {
    id : 7,
    parent : 6,
    valueA : 10,
    valueB : 19,
  }];

  beforeEach(inject(_TreeService_ => {
    Tree = _TreeService_;
    tree = new Tree(nodes);
  }));

  it('#constructor() should populate private variables', () => {
    expect(tree._rootNode).to.be.an('object');
    expect(tree._rootNode.children).to.be.an('array');
  });

  it('#constructor() the root node should have three childen', () => {
    const node = tree._rootNode;
    expect(node.children).to.have.length(3);
  });

  it('#walk() should be called for every node in the tree', () => {
    const size = nodes.length;
    let counter = 0;
    tree.walk(() => counter++);
    expect(counter).to.be.equal(size);
  });

  it('#walk() should visit every node in the tree', () => {
    tree.walk(node => { node.visited = tree; });
    const dump = tree.toArray();
    const everyNodeVisited = dump.every(node => node.visited);
    expect(everyNodeVisited).to.equal(true);
  });

  it('#find() should find node with id 4', () => {
    const node4 = tree.find(4);
    expect(node4.id).to.equal(4);
    expect(node4.valueA).to.equal(30);
    expect(node4.valueB).to.equal(4);
    expect(node4.children).to.have.length(0);
  });

  it('#find() node id:6 should have two children', () => {
    const node6 = tree.find(6);
    expect(node6.id).to.equal(6);
    expect(node6.children).to.have.length(2);
  });

  it('#toArray() should return an array', () => {
    const array = tree.toArray();
    expect(array).to.be.an('array');
    expect(array).to.have.length(nodes.length);
  });

  it('#constructor() tree should have a maximum depth of 3', () => {
    tree.walk(Tree.common.computeNodeDepth);
    let max = 0;
    tree.walk(node => { max = Math.max(max, node.depth); });
    expect(max).to.equal(3);
  });

  it('#walk () should be able to compute the balances of nodes', () => {
    const node1 = tree.find(1);
    const node4 = tree.find(4);
    const node6 = tree.find(6);

    // first level should not be defined
    expect(node1.valueA).to.be.undefined;  
    expect(node1.valueB).to.be.undefined;  

    // this is a level 1 leaf node, so its values are known.
    expect(node4.valueA).to.equal(30);
    expect(node4.valueB).to.equal(4);

    tree.walk(Tree.common.sumOnProperty('valueA'), false);

    expect(node1.valueA).to.equal(9);
    expect(node1.valueB).to.be.undefined;  

    expect(node4.valueA).to.equal(30);
    expect(node4.valueB).to.equal(4);

    // this condition sums multiple leaves
    tree.walk(Tree.common.sumOnProperty('valueB'), false);
    expect(node1.valueB).to.equal(7);

    expect(node4.valueA).to.equal(30);
    expect(node4.valueB).to.equal(4);

    expect(node6.valueA).to.equal(20);
    expect(node6.valueB).to.equal(21);
  });

  it('creates a tree of depth 3', () => {
    const dataset = [
      { id : 1, label : '1st Level', parent : 0 },
      { id : 2, label : '2nd Level', parent : 1 },
      { id : 3, label : '3rd Level', parent : 2 },
    ];

    const t = new Tree(dataset);
    t.walk(Tree.common.computeNodeDepth);
    const node = t.find(3);
    expect(node.depth).to.equal(3);
  });

});
