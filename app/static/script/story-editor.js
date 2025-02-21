/**
 * Graph Editor for Story Nodes and Edges
 * ---------------------------------------
 * This module manages:
 *  - Rendering of nodes and edges on the canvas.
 *  - Dragging and dropping nodes (with correct offset when scrolling).
 *  - File drop zones for left/right images.
 *  - CRUD operations for nodes and edges via a REST API.
 *
 * The code is structured into different classes (GraphEditor, GraphNode, GraphEdge)
 * to allow for improved scalability and easier addition of new functionality.
 *
 * Note: Adjust element selectors, API endpoints, or constants as needed.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Assume the story id is available via templating
  const storyId = Number(document.getElementById("story-id").textContent);
  const editor = new GraphEditor(storyId);
  editor.init();
});

class GraphEditor {
  constructor(storyId) {
    this.storyId = storyId;

    // DOM Elements
    this.graphContainer = document.getElementById("graph-container");
    this.edgesSvg = document.getElementById("edges-svg");

    // Drop zone elements for images
    this.leftDropZone = document.getElementById("left-drop-zone");
    this.leftFileInput = document.getElementById("node-left-img-file");
    this.leftFileName = document.getElementById("left-file-name");

    this.rightDropZone = document.getElementById("right-drop-zone");
    this.rightFileInput = document.getElementById("node-right-img-file");
    this.rightFileName = document.getElementById("right-file-name");

    this.backgroundDropZone = document.getElementById("background-drop-zone");
    this.backgroundFileInput = document.getElementById("node-background-img-file");
    this.backgroundFileName = document.getElementById("background-file-name");

    // Data: arrays of GraphNode and GraphEdge instances
    this.nodes = [];
    this.edges = [];

    // Drag & Selection State
    this.isDragging = false;
    this.dragCandidate = null;
    this.dragNode = null;
    this.selectedNode = null;
    this.selectedEdge = null;

    // Constants for node dimensions (should match your CSS)
    this.NODE_HALF_WIDTH = 75;
    this.NODE_HALF_HEIGHT = 40;
  }

  init() {
    this.setupDropZone(
      this.leftDropZone,
      this.leftFileInput,
      this.leftFileName,
      "node-left-img"
    );
    this.setupDropZone(
      this.rightDropZone,
      this.rightFileInput,
      this.rightFileName,
      "node-right-img"
    );

    this.setupDropZone(
      this.backgroundDropZone,
      this.backgroundFileInput,
      this.backgroundFileName,
      "node-background-img"
    );

    this.setupGraphEvents();
    this.setupFormEvents();

    this.setupAutoSync(
      ["story-name",
        "story-description"
      ], () => this.autoSyncStory()
    );

    this.setupAutoSync(
      [
        "node-type",
        "node-speaker",
        "node-content",
        "node-left-img",
        "node-right-img",
        "node-background-img"
      ],
      () => this.autoSyncNode()
    );

    // Add global keydown listener for deleting the selected edge.
    document.addEventListener("keydown", (evt) => {
      // Ensure the event target is not an input or textarea.
      if (["INPUT", "TEXTAREA"].indexOf(evt.target.tagName) === -1) {
        if ((evt.key === "Delete" || evt.key === "Backspace") && this.selectedEdge) {
          this.deleteEdge(this.selectedEdge);
        }
      }
    });

    // Fetch initial story data
    this.fetchStoryData();
  }

  /**
 * Generic helper: Attaches "input" and "change" listeners to a list of element IDs.
 * When any of the fields change, the provided syncFunction is called.
 * @param {string[]} fields - Array of element IDs.
 * @param {Function} syncFunction - Callback to call on change.
 */
  setupAutoSync(fields, syncFunction) {
    fields.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.addEventListener("input", syncFunction);
        el.addEventListener("change", syncFunction);
      }
    });
  }

  /**
   * Immediately syncs the story fields (name and description) to the server.
   * Assumes a single endpoint (/api/stories/{storyId}) that accepts a payload
   * with both "name" and "description" keys.
   */
  async autoSyncStory() {
    const title = document.getElementById("story-name").value;
    const description = document.getElementById("story-description").value;
    const payload = { title, description };
    try {
      await fetch(`/api/stories/${this.storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      // Optionally provide visual feedback here (e.g. flash "Saved!")
    } catch (error) {
      console.error("Error auto-syncing story fields:", error);
    }
  }

  /**
   * Immediately syncs the current node attributes to the server.
   */
  async autoSyncNode() {
    const nodeId = Number(document.getElementById("node-id").value);
    if (!nodeId) return; // No node is currently selected
    const payload = {
      node_type: document.getElementById("node-type").value,
      speaker: document.getElementById("node-speaker").value,
      content: document.getElementById("node-content").value,
      left_img: document.getElementById("node-left-img").value,
      right_img: document.getElementById("node-right-img").value,
      background_img: document.getElementById("node-background-img").value,
    };
    try {
      await fetch(`/api/stories/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Optionally update local state or re-render
    } catch (error) {
      console.error("Error auto-syncing node:", error);
    }
    this.fetchStoryData();
  }



  /**
   * Setup a file drop zone for images.
   * @param {HTMLElement} dropZone
   * @param {HTMLInputElement} fileInput
   * @param {HTMLElement} fileNameDisplay
   * @param {string} targetFieldId
   */
  setupDropZone(dropZone, fileInput, fileNameDisplay, targetFieldId) {
    const onDragOver = (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    };

    const onDragLeave = () => {
      dropZone.classList.remove("dragover");
    };

    const onDrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const fileName = e.dataTransfer.files[0].name;
        fileNameDisplay.textContent = fileName;
        document.getElementById(targetFieldId).value = fileName;
      }
    };

    const onChange = () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        fileNameDisplay.textContent = fileName;
        document.getElementById(targetFieldId).value = fileName;
      }
    };

    dropZone.addEventListener("dragover", onDragOver);
    dropZone.addEventListener("dragleave", onDragLeave);
    dropZone.addEventListener("drop", onDrop);
    fileInput.addEventListener("change", onChange);
  }

  setupGraphEvents() {
    document.addEventListener("mousemove", (evt) => this.handleMouseMove(evt));
    document.addEventListener("mouseup", (evt) => this.handleMouseUp(evt));
  }

  setupFormEvents() {
    document.getElementById("add-node-btn").onclick = () => this.createNode();
    document.getElementById("save-node-btn").onclick = () => this.saveNode();
  }

  /**
   * Sets the drag candidate for a node.
   * @param {GraphNode} node
   * @param {MouseEvent} evt
   */
  setDragCandidate(node, evt) {
    this.dragCandidate = {
      node,
      startX: evt.clientX,
      startY: evt.clientY,
      offsetX: evt.offsetX,
      offsetY: evt.offsetY,
    };
  }

  handleMouseMove(evt) {
    if (this.isDragging && this.dragNode) {
      this.moveDraggedNode(evt);
      return;
    }
    if (this.dragCandidate && !this.isDragging) {
      const dx = evt.clientX - this.dragCandidate.startX;
      const dy = evt.clientY - this.dragCandidate.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this.isDragging = true;
        this.dragNode = this.dragCandidate.node;
        this.moveDraggedNode(evt);
      }
    }
  }

  handleMouseUp(evt) {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragNode = null;
      this.dragCandidate = null;
      return;
    }
    if (this.dragCandidate) {
      this.dragCandidate = null;
      return;
    }
    // Clear selection if clicking on the container (without CTRL)
    if (this.graphContainer.contains(evt.target) && !evt.ctrlKey) {
      this.selectedNode = null;
      this.clearNodeForm();
      this.render();
    }
    if (!evt.target.classList.contains("edge") && !evt.ctrlKey) {
      this.selectedEdge = null;
      this.render();
    }
  }

  /**
   * Moves the currently dragged node.
   * Fixes scrolling issues by using the container's bounding rectangle.
   * @param {MouseEvent} evt
   */
  moveDraggedNode(evt) {
    if (!this.dragNode || !this.dragCandidate) return;
    const containerRect = this.graphContainer.getBoundingClientRect();
    const newX = evt.clientX - containerRect.left - this.dragCandidate.offsetX;
    const newY = evt.clientY - containerRect.top - this.dragCandidate.offsetY;
    this.dragNode.x = Math.max(newX, 0);
    this.dragNode.y = Math.max(newY, 0);
    this.render();
  }

  /**
   * Fetches story nodes and edges from the server.
   */
  async fetchStoryData() {
    try {
      const storyResponse = await fetch(`/api/stories/${this.storyId}`);
      const storyData = await storyResponse.json();
      document.getElementById("story-name").value = storyData.title;
      document.getElementById("story-description").value = storyData.description;
      // ----- Fetch Nodes -----
      const nodesResponse = await fetch(`/api/stories/${this.storyId}/nodes`);
      const nodesData = await nodesResponse.json();
      const fetchedNodes = nodesData.nodes;
      const fetchedNodesMap = new Map(fetchedNodes.map((n) => [n.id, n]));

      fetchedNodes.forEach((nodeData) => {
        let node = this.getNodeById(nodeData.id);
        if (node) {
          // Preserve x/y positions
          const { x, y } = node;
          node.update(nodeData);
          node.x = x;
          node.y = y;
        } else {
          const spacingX = 300,
            spacingY = 150,
            columns = 5,
            index = this.nodes.length;
          node = new GraphNode(
            {
              ...nodeData,
              x:
                nodeData.x != null
                  ? nodeData.x
                  : (index % columns) * spacingX + 50,
              y:
                nodeData.y != null
                  ? nodeData.y
                  : Math.floor(index / columns) * spacingY + 50,
            },
            this
          );
          this.nodes.push(node);
        }
      });

      // Remove nodes no longer present
      this.nodes = this.nodes.filter((node) => fetchedNodesMap.has(node.id));

      // ----- Fetch Edges -----
      const edgesResponse = await fetch(`/api/stories/${this.storyId}/edges`);
      const edgesData = await edgesResponse.json();
      const fetchedEdges = edgesData.edges;
      const edgeKey = (edge) => `${edge.from}-${edge.to}`;
      const fetchedEdgesMap = new Map(
        fetchedEdges.map((e) => [edgeKey(e), e])
      );

      fetchedEdges.forEach((edgeData) => {
        let edge = this.edges.find((e) => edgeKey(e) === edgeKey(edgeData));
        if (edge) {
          edge.update(edgeData);
        } else {
          edge = new GraphEdge(edgeData, this);
          this.edges.push(edge);
        }
      });

      // Remove edges no longer present
      this.edges = this.edges.filter((edge) =>
        fetchedEdgesMap.has(edgeKey(edge))
      );

      this.render();
    } catch (error) {
      console.error("Error fetching story data:", error);
    }
  }

  /**
   * Renders both nodes and edges.
   */
  render() {
    this.renderNodes();
    this.renderEdges();
  }

  renderNodes() {
    // Remove only the node elements, leaving the SVG untouched.
    this.graphContainer.querySelectorAll(".story-node").forEach((nodeEl) => nodeEl.remove());

    // Render each node by delegating to the GraphNode class
    this.nodes.forEach((node) => {
      const nodeEl = node.render();
      this.graphContainer.appendChild(nodeEl);
    });
  }


  renderEdges() {
    // Clear existing edges
    [...this.edgesSvg.children].forEach(child => {
      if (child.tagName.toLowerCase() !== 'defs') {
        child.remove();
      }
    });
    this.edges.forEach((edge) => {
      const line = edge.render();
      if (line) {
        this.edgesSvg.appendChild(line);
      }
    });
  }

  /**
   * Computes the intersection point on a node's border given a target point.
   * @param {GraphNode} node
   * @param {number} targetX
   * @param {number} targetY
   * @returns {x: number, y: number}
   */
  getIntersection(node, targetX, targetY) {
    const halfWidth = this.NODE_HALF_WIDTH;
    const halfHeight = this.NODE_HALF_HEIGHT;
    const centerX = node.x + halfWidth;
    const centerY = node.y + halfHeight;
    let dx = targetX - centerX;
    let dy = targetY - centerY;

    if (dx === 0 && dy === 0) {
      return { x: centerX, y: centerY };
    }

    const scaleX = halfWidth / Math.abs(dx);
    const scaleY = halfHeight / Math.abs(dy);
    const scale = Math.min(scaleX, scaleY);

    return {
      x: centerX + dx * scale,
      y: centerY + dy * scale,
    };
  }

  /**
   * Returns the GraphNode with the specified id.
   * @param {number} id
   */
  getNodeById(id) {
    return this.nodes.find((node) => node.id === id);
  }

  /**
   * Sends a request to create a new node.
   */
  async createNode() {
    const payload = {
      node_type: "DIALOG",
      content: "New node",
      speaker: "",
      left_img: "",
      right_img: "",
      background_img: ""
    };
    try {
      await fetch(`/api/stories/${this.storyId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await this.fetchStoryData();
    } catch (error) {
      console.error("Error creating node:", error);
    }
  }

  /**
   * Sends a request to delete a node.
   * @param {number} nodeId
   */
  async deleteNode(nodeId) {
    const node = this.getNodeById(nodeId);
    if (!node) return;
    if (node.node_type === "START") {
      alert("Can't delete the START node!");
      return;
    }
    try {
      await fetch(`/api/stories/nodes/${nodeId}`, {
        method: "DELETE",
      });
      await this.fetchStoryData();
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  }

  /**
   * Sends a request to create a new edge.
   * @param {number} fromNodeId
   * @param {number} toNodeId
   */
  async createEdge(fromNodeId, toNodeId) {
    const payload = {
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
      condition: "SUCCESS",
    };
    try {
      await fetch(`/api/stories/${this.storyId}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await this.fetchStoryData();
    } catch (error) {
      console.error("Error creating edge:", error);
    }
  }

  async deleteEdge(edge) {
    const payload = {
      from_node_id: edge.from,
      to_node_id: edge.to,
    };
    try {
      // Adjust the API endpoint as needed. This example assumes a query string.
      await fetch(`/api/stories/${this.storyId}/edges`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      this.selectedEdge = null; // Clear the selection.
      await this.fetchStoryData(); // Refresh data.
    } catch (error) {
      console.error("Error deleting edge:", error);
    }
  }

  loadNodeForm(nodeId) {
    const node = this.getNodeById(nodeId);
    if (!node) return;
    document.getElementById("node-id").value = node.id;
    document.getElementById("node-id-display").innerText = node.id;
    document.getElementById("node-type").value = node.node_type;
    document.getElementById("node-speaker").value = node.speaker;
    document.getElementById("node-content").value = node.content;
    document.getElementById("node-left-img").value = node.left_img;
    document.getElementById("node-right-img").value = node.right_img;
  }

  clearNodeForm() {
    document.getElementById("node-id").value = "";
    document.getElementById("node-type").value = "DIALOG";
    document.getElementById("node-speaker").value = "";
    document.getElementById("node-content").value = "";
    document.getElementById("node-left-img").value = "";
    document.getElementById("node-right-img").value = "";
  }

  async saveNode() {
    const nodeId = Number(document.getElementById("node-id").value);
    const payload = {
      node_type: document.getElementById("node-type").value,
      speaker: document.getElementById("node-speaker").value,
      content: document.getElementById("node-content").value,
      left_img: document.getElementById("node-left-img").value,
      right_img: document.getElementById("node-right-img").value,
    };

    try {
      if (!nodeId) {
        await this.createNode();
      } else {
        await fetch(`/api/stories/nodes/${nodeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await this.fetchStoryData();
      }
    } catch (error) {
      console.error("Error saving node:", error);
    }
  }

}

class GraphNode {
  /**
   * Constructs a GraphNode.
   * @param {Object} data - Node data from the server.
   * @param {GraphEditor} editor - The parent editor instance.
   */
  constructor(data, editor) {
    this.id = data.id;
    this.node_type = data.node_type;
    this.content = data.content;
    this.speaker = data.speaker;
    this.left_img = data.left_img;
    this.right_img = data.right_img;
    this.background_img = data.background_img
    this.x = data.x;
    this.y = data.y;
    this.editor = editor;
  }

  /**
   * Updates the node's data (preserving position).
   * @param {Object} data
   */
  update(data) {
    Object.assign(this, data);
  }

  /**
   * Creates and returns the DOM element for the node.
   * @returns {HTMLElement}
   */
  render() {
    const nodeEl = document.createElement("div");
    nodeEl.className = "story-node";
    nodeEl.style.left = `${this.x}px`;
    nodeEl.style.top = `${this.y}px`;

    if (this.editor.selectedNode && this.editor.selectedNode.id === this.id) {
      nodeEl.classList.add("selected");
    }

    const titleEl = document.createElement("div");
    titleEl.className = "title";
    titleEl.innerText = `Node #${this.id}`;
    nodeEl.appendChild(titleEl);

    const typeEl = document.createElement("div");
    typeEl.className = "node-type";
    typeEl.innerText = this.node_type;
    nodeEl.appendChild(typeEl);

    if (this.node_type !== "START") {
      const delBtn = document.createElement("span");
      delBtn.className = "delete-btn";
      delBtn.innerText = "×";
      delBtn.title = "Delete node";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.editor.deleteNode(this.id);
      };
      nodeEl.appendChild(delBtn);
    }

    // Setup drag & selection events.
    nodeEl.onmousedown = (evt) => {
      evt.stopPropagation();
      if (evt.ctrlKey) return;
      this.editor.setDragCandidate(this, evt);
    };

    nodeEl.onclick = (evt) => {
      if (this.editor.isDragging) return;
      if (evt.ctrlKey) {
        if (
          this.editor.selectedNode &&
          this.editor.selectedNode.id !== this.id
        ) {
          this.editor.createEdge(this.editor.selectedNode.id, this.id);
        }
        return;
      }
      if (
        this.editor.selectedNode &&
        this.editor.selectedNode.id === this.id
      ) {
        this.editor.selectedNode = null;
        this.editor.clearNodeForm();
      } else {
        this.editor.selectedNode = this;
        this.editor.loadNodeForm(this.id);
      }
      this.editor.render();
    };

    return nodeEl;
  }
}

class GraphEdge {
  /**
   * Constructs a GraphEdge.
   * @param {Object} data - Edge data from the server.
   * @param {GraphEditor} editor - The parent editor instance.
   */
  constructor(data, editor) {
    this.from = Number(data.from);
    this.to = Number(data.to);
    this.condition = data.condition;
    this.editor = editor;
  }

  /**
   * Updates the edge's data.
   * @param {Object} data
   */
  update(data) {
    Object.assign(this, data);
  }

  /**
   * Creates and returns the SVG line element for the edge.
   * @returns {SVGLineElement|null}
   */
  render() {
    const fromNode = this.editor.getNodeById(this.from);
    const toNode = this.editor.getNodeById(this.to);
    if (!fromNode || !toNode) return null;

    // Calculate centers of the nodes.
    const fromCenter = {
      x: fromNode.x + this.editor.NODE_HALF_WIDTH,
      y: fromNode.y + this.editor.NODE_HALF_HEIGHT,
    };
    const toCenter = {
      x: toNode.x + this.editor.NODE_HALF_WIDTH,
      y: toNode.y + this.editor.NODE_HALF_HEIGHT,
    };

    // Compute the intersection points on the node borders.
    const startPoint = this.editor.getIntersection(fromNode, toCenter.x, toCenter.y);
    let endPoint = this.editor.getIntersection(toNode, fromCenter.x, fromCenter.y);

    // Calculate the vector from the target node's center to the intersection point.
    const dx = endPoint.x - toCenter.x;
    const dy = endPoint.y - toCenter.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const markerOffset = 15; // This matches your marker's refX value

    // Extend the endpoint along the computed direction by markerOffset.
    if (len > 0) {
      endPoint.x += (dx / len) * markerOffset;
      endPoint.y += (dy / len) * markerOffset;
    }

    // Create the SVG line element with the adjusted endpoint.
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "edge");
    line.setAttribute("marker-end", "url(#arrowhead)");
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("x1", startPoint.x);
    line.setAttribute("y1", startPoint.y);
    line.setAttribute("x2", endPoint.x);
    line.setAttribute("y2", endPoint.y);
    line.style.pointerEvents = "stroke";


    // If this edge is currently selected, add a class for visual feedback.
    if (
      this.editor.selectedEdge &&
      this.editor.selectedEdge.from === this.from &&
      this.editor.selectedEdge.to === this.to
    ) {
      line.classList.add("selected"); // Make sure to define this class in your CSS.
    }

    // Attach a click event listener to select this edge.
    line.addEventListener("mousedown", (evt) => {
      evt.stopPropagation(); // Prevent container clicks from clearing the selection.
      this.editor.selectedEdge = this.editor.selectedEdge === null ? this : null;
      this.editor.selectedNode = null; // Clear node selection, if any.
      this.editor.render();
    });


    return line;
  }

}