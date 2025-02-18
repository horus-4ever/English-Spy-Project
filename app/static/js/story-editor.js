// -- Setup some global references --
const storyId = {{ story_id }};
const graphContainer = document.getElementById("graph-container");
const edgesSvg = document.getElementById("edges-svg");

// Our data in memory:
let nodes = []; // {id, node_type, content, speaker, left_img, right_img, x, y}
let edges = []; // {from, to, condition}

// For dragging nodes
let selectedNode = null;
let offsetX = 0, offsetY = 0;

// For connecting edges
let edgeStartNodeId = null;

// ------------------------------------------------------------------
//  Render Functions
// ------------------------------------------------------------------
function renderAll() {
  console.log(nodes);
  renderNodes();
  renderEdges();
}

function renderNodes() {
  // Remove old nodes from the DOM
  document.querySelectorAll(".story-node").forEach((n) => n.remove());

  nodes.forEach((node) => {
    const el = document.createElement("div");
    el.className = "story-node";
    el.style.left = node.x + "px";
    el.style.top = node.y + "px";

    // Node highlight if selected
    if (selectedNode && selectedNode.id === node.id) {
      el.classList.add("selected");
    }

    // Title
    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.innerText = `Node #${node.id}`;
    el.appendChild(titleDiv);

    // Type
    const typeDiv = document.createElement("div");
    typeDiv.className = "node-type";
    typeDiv.innerText = node.node_type;
    el.appendChild(typeDiv);

    // DELETE button for non-START
    if (node.node_type !== "START") {
      const delBtn = document.createElement("span");
      delBtn.className = "delete-btn";
      delBtn.innerText = "×";
      delBtn.title = "Delete node";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteNode(node.id);
      };
      el.appendChild(delBtn);
    }

    // MOUSEDOWN => Start dragging
    el.onmousedown = (evt) => {
      if (evt.shiftKey) {
        // SHIFT + click means we might be creating an edge
        handleShiftClickNode(node.id);
      } else {
        // Normal click => start drag
        selectedNode = node;
        offsetX = evt.offsetX;
        offsetY = evt.offsetY;
      }
    };

    // CLICK => load node form
    el.onclick = (evt) => {
      evt.stopPropagation(); // don't unselect
      loadNodeForm(node.id);
    };

    graphContainer.appendChild(el);
  });
}

function renderEdges() {
  // Remove old lines
  edgesSvg.querySelectorAll("line.edge").forEach((line) => line.remove());

  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "edge");
    line.setAttribute("marker-end", "url(#arrowhead)");

    const x1 = fromNode.x + 75; // center of a 150px wide node
    const y1 = fromNode.y + 40; // approximate center in height
    const x2 = toNode.x + 75;
    const y2 = toNode.y + 40;

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);

    edgesSvg.appendChild(line);
  });
}

// ------------------------------------------------------------------
//  Event Handling / Node Draggable
// ------------------------------------------------------------------
document.addEventListener("mousemove", (evt) => {
  if (!selectedNode) return;
  // Move node in memory
  const newX = evt.clientX - graphContainer.offsetLeft - offsetX;
  const newY = evt.clientY - graphContainer.offsetTop - offsetY;
  selectedNode.x = Math.max(newX, 0);
  selectedNode.y = Math.max(newY, 0);

  renderAll();
});

document.addEventListener("mouseup", (evt) => {
  if (selectedNode) {
    // Optionally save the new position to DB here or do it on “Save Node”.
    selectedNode = null;
  }
});

// SHIFT-CLICK to connect edges
function handleShiftClickNode(nodeId) {
  if (edgeStartNodeId === null) {
    // Start a link
    edgeStartNodeId = nodeId;
    highlightNode(edgeStartNodeId, true);
  } else {
    // Complete the link
    const from = edgeStartNodeId;
    const to = nodeId;
    if (from !== to) {
      createEdge(from, to);
    }
    highlightNode(edgeStartNodeId, false);
    edgeStartNodeId = null;
  }
}

function highlightNode(nodeId, doHighlight) {
  const nodeDiv = Array.from(document.querySelectorAll(".story-node")).find((el) =>
    el.querySelector(".title")?.innerText.includes(`#${nodeId}`)
  );
  if (!nodeDiv) return;
  if (doHighlight) {
    nodeDiv.classList.add("highlight-edge");
  } else {
    nodeDiv.classList.remove("highlight-edge");
  }
}

// ------------------------------------------------------------------
//  CRUD Functions
// ------------------------------------------------------------------
async function fetchStoryData() {
  const resNodes = await fetch(`/api/stories/${storyId}/nodes`);
  const nodesData = await resNodes.json();
  nodes = nodesData.nodes.map((n) => ({
    ...n,
    x: n.x || Math.random() * 300 + 50,
    y: n.y || Math.random() * 200 + 50,
  }));

  const resEdges = await fetch(`/api/stories/${storyId}/edges`);
  const edgesData = await resEdges.json();
  edges = edgesData.edges;

  renderAll();
}

async function createNode() {
  // POST /api/stories/<storyId>/nodes
  const payload = {
    node_type: "DIALOG",
    content: "New node",
    speaker: "",
    left_img: "",
    right_img: "",
  };
  await fetch(`/api/stories/${storyId}/nodes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await fetchStoryData();
}

async function deleteNode(nodeId) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;
  if (node.node_type === "START") {
    alert("Can't delete the START node!");
    return;
  }
  // DELETE /api/stories/nodes/<id>
  await fetch(`/api/stories/nodes/${nodeId}`, { method: "DELETE" });
  await fetchStoryData();
}

async function createEdge(fromNodeId, toNodeId) {
  const payload = {
    from_node_id: fromNodeId,
    to_node_id: toNodeId,
    condition: "SUCCESS",
  };
  await fetch(`/api/stories/${storyId}/edges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await fetchStoryData();
}

function loadNodeForm(nodeId) {
  // Load node data into the form
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;
  document.getElementById("node-id").value = node.id;
  document.getElementById("node-type").value = node.node_type;
  document.getElementById("node-speaker").value = node.speaker;
  document.getElementById("node-content").value = node.content;
  document.getElementById("node-left-img").value = node.left_img;
  document.getElementById("node-right-img").value = node.right_img;

  // Mark this node as selected in memory, so we highlight
  selectedNode = node;
  renderAll();
}

async function saveNode() {
  const nodeId = Number(document.getElementById("node-id").value);
  if (!nodeId) {
    // If there's no ID, let's do "createNode" instead
    return createNode();
  }
  // Otherwise, update existing node
  const payload = {
    node_type: document.getElementById("node-type").value,
    speaker: document.getElementById("node-speaker").value,
    content: document.getElementById("node-content").value,
    left_img: document.getElementById("node-left-img").value,
    right_img: document.getElementById("node-right-img").value,
  };
  await fetch(`/api/stories/nodes/${nodeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await fetchStoryData();
}

// ------------------------------------------------------------------
//  DOM Setup
// ------------------------------------------------------------------
document.getElementById("add-node-btn").onclick = createNode;
document.getElementById("save-node-btn").onclick = saveNode;

// Click outside any node => unselect
graphContainer.onclick = () => {
  selectedNode = null;
  renderAll();
};

// On page load, get data
window.addEventListener("load", fetchStoryData);