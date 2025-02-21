(function () {
  "use strict";

  // ---------------------------
  // CONFIGURATION & UTILITIES
  // ---------------------------
  const CONFIG = {
    API_BASE: "/api/stories",
    NODE_DIMENSIONS: { halfWidth: 75, halfHeight: 40 },
    SPACING: { x: 300, y: 150 },
    COLUMNS: 5,
    MARKER_OFFSET: 15,
  };

  const Utils = {
    autoFormatHtml() {
      if (ModalEditor.getMode() === "htmlmixed") {
        const currentCode = ModalEditor.getValue();
        const formattedCode = html_beautify(currentCode, {
          indent_size: 2,
          wrap_line_length: 80,
        });
        ModalEditor.setValue(formattedCode);
      }
    },

    getIntersection(node, targetX, targetY) {
      const { halfWidth, halfHeight } = CONFIG.NODE_DIMENSIONS;
      const centerX = node.x + halfWidth;
      const centerY = node.y + halfHeight;
      let dx = targetX - centerX;
      let dy = targetY - centerY;
      if (dx === 0 && dy === 0) return { x: centerX, y: centerY };
      const scaleX = halfWidth / Math.abs(dx);
      const scaleY = halfHeight / Math.abs(dy);
      const scale = Math.min(scaleX, scaleY);
      return { x: centerX + dx * scale, y: centerY + dy * scale };
    },
  };

  // ---------------------------
  // MODAL EDITOR MODULE
  // ---------------------------
  const ModalEditor = (function () {
    let modalEditor = null;

    function init() {
      const modal = document.getElementById("editor-modal");
      modal.style.display = "block";
      const currentContent = document.getElementById("node-content").value;
      const modalTextarea = document.getElementById("modal-editor");
      modalTextarea.value = currentContent;
      modalEditor = CodeMirror.fromTextArea(modalTextarea, {
        mode: "htmlmixed",
        lineNumbers: true,
        theme: "eclipse",
        viewportMargin: Infinity,
      });
      Utils.autoFormatHtml();
    }

    function close(saveChanges) {
      const modal = document.getElementById("editor-modal");
      if (saveChanges && modalEditor) {
        const updatedContent = modalEditor.getValue();
        document.getElementById("node-content").value = updatedContent;
        document
          .getElementById("node-content")
          .dispatchEvent(new Event("change"));
      }
      if (modalEditor) {
        const wrapper = modalEditor.getWrapperElement();
        wrapper.parentNode.replaceChild(modalEditor.getTextArea(), wrapper);
        modalEditor = null;
      }
      modal.style.display = "none";
    }

    function getValue() {
      return modalEditor ? modalEditor.getValue() : "";
    }

    function setValue(val) {
      if (modalEditor) modalEditor.setValue(val);
    }

    function getMode() {
      return modalEditor ? modalEditor.getOption("mode") : null;
    }

    return {
      init,
      close,
      getValue,
      setValue,
      getMode,
    };
  })();

  // ---------------------------
  // FILE DROP ZONE MODULE
  // ---------------------------
  function FileDropZone(dropZoneId, fileInputId, fileNameDisplayId, targetFieldId) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const fileNameDisplay = document.getElementById(fileNameDisplayId);

    function onDragOver(e) {
      e.preventDefault();
      dropZone.classList.add("dragover");
    }

    function onDragLeave() {
      dropZone.classList.remove("dragover");
    }

    function onDrop(e) {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const fileName = e.dataTransfer.files[0].name;
        fileNameDisplay.textContent = fileName;
        document.getElementById(targetFieldId).value = fileName;
      }
    }

    function onChange() {
      if (fileInput.files && fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        fileNameDisplay.textContent = fileName;
        document.getElementById(targetFieldId).value = fileName;
      }
    }

    dropZone.addEventListener("dragover", onDragOver);
    dropZone.addEventListener("dragleave", onDragLeave);
    dropZone.addEventListener("drop", onDrop);
    fileInput.addEventListener("change", onChange);
  }

  // ---------------------------
  // API SERVICE MODULE
  // ---------------------------
  const ApiService = {
    async get(url) {
      const response = await fetch(url);
      return response.json();
    },
    async post(url, payload) {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async put(url, payload) {
      return fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async delete(url, payload) {
      return fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  };

  // ---------------------------
  // GRAPH EDITOR CLASS
  // ---------------------------
  class GraphEditor {
    constructor(storyId) {
      this.storyId = storyId;
      this.graphContainer = document.getElementById("graph-container");
      this.edgesSvg = document.getElementById("edges-svg");
      this.nodes = [];
      this.edges = [];
      this.isDragging = false;
      this.dragCandidate = null;
      this.dragNode = null;
      this.selectedNode = null;
      this.selectedEdge = null;
      this.setupFileDropZones();
    }

    setupFileDropZones() {
      FileDropZone("left-drop-zone", "node-left-img-file", "left-file-name", "node-left-img");
      FileDropZone("right-drop-zone", "node-right-img-file", "right-file-name", "node-right-img");
      FileDropZone("background-drop-zone", "node-background-img-file", "background-file-name", "node-background-img");
    }

    init() {
      this.setupGraphEvents();
      this.setupFormEvents();
      this.setupAutoSync(["story-name", "story-description"], () =>
        this.autoSyncStory()
      );
      this.setupAutoSync(
        [
          "node-type",
          "node-speaker",
          "node-content",
          "node-left-img",
          "node-right-img",
          "node-background-img",
        ],
        () => this.autoSyncNode()
      );
      document.addEventListener("keydown", (evt) => {
        if (
          ["INPUT", "TEXTAREA"].indexOf(evt.target.tagName) === -1 &&
          (evt.key === "Delete" || evt.key === "Backspace") &&
          this.selectedEdge
        ) {
          this.deleteEdge(this.selectedEdge);
        }
      });
      this.fetchStoryData();
    }

    setupAutoSync(fields, syncFunction) {
      fields.forEach((fieldId) => {
        const el = document.getElementById(fieldId);
        if (el) {
          el.addEventListener("input", syncFunction);
          el.addEventListener("change", syncFunction);
        }
      });
    }

    async autoSyncStory() {
      const payload = {
        title: document.getElementById("story-name").value,
        description: document.getElementById("story-description").value,
      };
      try {
        await ApiService.put(`${CONFIG.API_BASE}/${this.storyId}`, payload);
      } catch (error) {
        console.error("Error auto-syncing story fields:", error);
      }
    }

    async autoSyncNode() {
      const nodeId = Number(document.getElementById("node-id").value);
      if (!nodeId) return;
      const payload = {
        node_type: document.getElementById("node-type").value,
        speaker: document.getElementById("node-speaker").value,
        content: document.getElementById("node-content").value,
        left_img: document.getElementById("node-left-img").value,
        right_img: document.getElementById("node-right-img").value,
        background_img: document.getElementById("node-background-img").value,
      };
      try {
        await ApiService.put(`${CONFIG.API_BASE}/nodes/${nodeId}`, payload);
      } catch (error) {
        console.error("Error auto-syncing node:", error);
      }
      this.fetchStoryData();
    }

    setupGraphEvents() {
      document.addEventListener("mousemove", (evt) => this.handleMouseMove(evt));
      document.addEventListener("mouseup", (evt) => this.handleMouseUp(evt));
    }

    setupFormEvents() {
      document.getElementById("add-node-btn").onclick = () => this.createNode();
      document.getElementById("save-node-btn").onclick = () => this.saveNode();
    }

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

    moveDraggedNode(evt) {
      if (!this.dragNode || !this.dragCandidate) return;
      const containerRect = this.graphContainer.getBoundingClientRect();
      const newX = evt.clientX - containerRect.left - this.dragCandidate.offsetX;
      const newY = evt.clientY - containerRect.top - this.dragCandidate.offsetY;
      this.dragNode.x = Math.max(newX, 0);
      this.dragNode.y = Math.max(newY, 0);
      this.render();
    }

    async fetchStoryData() {
      try {
        const storyData = await ApiService.get(`${CONFIG.API_BASE}/${this.storyId}`);
        document.getElementById("story-name").value = storyData.title;
        document.getElementById("story-description").value = storyData.description;

        const nodesData = await ApiService.get(`${CONFIG.API_BASE}/${this.storyId}/nodes`);
        const fetchedNodes = nodesData.nodes;
        const fetchedNodesMap = new Map(fetchedNodes.map((n) => [n.id, n]));

        fetchedNodes.forEach((nodeData) => {
          let node = this.getNodeById(nodeData.id);
          if (node) {
            const { x, y } = node;
            node.update(nodeData);
            node.x = x;
            node.y = y;
          } else {
            const index = this.nodes.length;
            nodeData.x =
              nodeData.x != null
                ? nodeData.x
                : (index % CONFIG.COLUMNS) * CONFIG.SPACING.x + 50;
            nodeData.y =
              nodeData.y != null
                ? nodeData.y
                : Math.floor(index / CONFIG.COLUMNS) * CONFIG.SPACING.y + 50;
            node = new GraphNode(nodeData, this);
            this.nodes.push(node);
          }
        });
        this.nodes = this.nodes.filter((node) => fetchedNodesMap.has(node.id));

        const edgesData = await ApiService.get(`${CONFIG.API_BASE}/${this.storyId}/edges`);
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
        this.edges = this.edges.filter((edge) =>
          fetchedEdgesMap.has(edgeKey(edge))
        );
        this.render();
      } catch (error) {
        console.error("Error fetching story data:", error);
      }
    }

    render() {
      this.renderNodes();
      this.renderEdges();
    }

    renderNodes() {
      this.graphContainer.querySelectorAll(".story-node").forEach((nodeEl) => nodeEl.remove());
      this.nodes.forEach((node) => {
        const nodeEl = node.render();
        this.graphContainer.appendChild(nodeEl);
      });
    }

    renderEdges() {
      [...this.edgesSvg.children].forEach(child => {
        if (child.tagName.toLowerCase() !== 'defs') {
          child.remove();
        }
      });
      this.edges.forEach((edge) => {
        const line = edge.render();
        if (line) this.edgesSvg.appendChild(line);
      });
    }

    getNodeById(id) {
      return this.nodes.find((node) => node.id === id);
    }

    async createNode() {
      const payload = {
        node_type: "DIALOG",
        content: "New node",
        speaker: "",
        left_img: "",
        right_img: "",
        background_img: "",
      };
      try {
        await ApiService.post(`${CONFIG.API_BASE}/${this.storyId}/nodes`, payload);
        await this.fetchStoryData();
      } catch (error) {
        console.error("Error creating node:", error);
      }
    }

    async deleteNode(nodeId) {
      const node = this.getNodeById(nodeId);
      if (!node) return;
      if (node.node_type === "START") {
        alert("Can't delete the START node!");
        return;
      }
      try {
        await ApiService.delete(`${CONFIG.API_BASE}/nodes/${nodeId}`);
        await this.fetchStoryData();
      } catch (error) {
        console.error("Error deleting node:", error);
      }
    }

    async createEdge(fromNodeId, toNodeId) {
      const payload = {
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        condition: "SUCCESS",
      };
      try {
        await ApiService.post(`${CONFIG.API_BASE}/${this.storyId}/edges`, payload);
        await this.fetchStoryData();
      } catch (error) {
        console.error("Error creating edge:", error);
      }
    }

    async deleteEdge(edge) {
      const payload = { from_node_id: edge.from, to_node_id: edge.to };
      try {
        await ApiService.delete(`${CONFIG.API_BASE}/${this.storyId}/edges`, payload);
        this.selectedEdge = null;
        await this.fetchStoryData();
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
          await ApiService.put(`${CONFIG.API_BASE}/nodes/${nodeId}`, payload);
          await this.fetchStoryData();
        }
      } catch (error) {
        console.error("Error saving node:", error);
      }
    }
  }

  // ---------------------------
  // GRAPH NODE CLASS
  // ---------------------------
  class GraphNode {
    constructor(data, editor) {
      this.id = data.id;
      this.node_type = data.node_type;
      this.content = data.content;
      this.speaker = data.speaker;
      this.left_img = data.left_img;
      this.right_img = data.right_img;
      this.background_img = data.background_img;
      this.x = data.x;
      this.y = data.y;
      this.editor = editor;
    }

    update(data) {
      Object.assign(this, data);
    }

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
      nodeEl.onmousedown = (evt) => {
        evt.stopPropagation();
        if (!evt.ctrlKey) {
          this.editor.setDragCandidate(this, evt);
        }
      };
      nodeEl.onclick = (evt) => {
        if (this.editor.isDragging) return;
        if (evt.ctrlKey) {
          if (this.editor.selectedNode && this.editor.selectedNode.id !== this.id) {
            this.editor.createEdge(this.editor.selectedNode.id, this.id);
          }
          return;
        }
        if (this.editor.selectedNode && this.editor.selectedNode.id === this.id) {
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

  // ---------------------------
  // GRAPH EDGE CLASS
  // ---------------------------
  class GraphEdge {
    constructor(data, editor) {
      this.from = Number(data.from);
      this.to = Number(data.to);
      this.condition = data.condition;
      this.editor = editor;
    }

    update(data) {
      Object.assign(this, data);
    }

    render() {
      const fromNode = this.editor.getNodeById(this.from);
      const toNode = this.editor.getNodeById(this.to);
      if (!fromNode || !toNode) return null;
      const fromCenter = {
        x: fromNode.x + CONFIG.NODE_DIMENSIONS.halfWidth,
        y: fromNode.y + CONFIG.NODE_DIMENSIONS.halfHeight,
      };
      const toCenter = {
        x: toNode.x + CONFIG.NODE_DIMENSIONS.halfWidth,
        y: toNode.y + CONFIG.NODE_DIMENSIONS.halfHeight,
      };
      const startPoint = Utils.getIntersection(fromNode, toCenter.x, toCenter.y);
      let endPoint = Utils.getIntersection(toNode, fromCenter.x, fromCenter.y);
      const dx = endPoint.x - toCenter.x;
      const dy = endPoint.y - toCenter.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        endPoint.x += (dx / len) * CONFIG.MARKER_OFFSET;
        endPoint.y += (dy / len) * CONFIG.MARKER_OFFSET;
      }
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
      if (
        this.editor.selectedEdge &&
        this.editor.selectedEdge.from === this.from &&
        this.editor.selectedEdge.to === this.to
      ) {
        line.classList.add("selected");
      }
      line.addEventListener("mousedown", (evt) => {
        evt.stopPropagation();
        this.editor.selectedEdge = this.editor.selectedEdge === null ? this : null;
        this.editor.selectedNode = null;
        this.editor.render();
      });
      return line;
    }
  }

  // ---------------------------
  // INITIALIZATION
  // ---------------------------
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("expand-editor-btn").addEventListener("click", () =>
      ModalEditor.init()
    );
    document.getElementById("close-modal-btn").addEventListener("click", () =>
      ModalEditor.close(true)
    );
    document.getElementById("save-modal-btn").addEventListener("click", () =>
      ModalEditor.close(true)
    );
    window.addEventListener("click", (event) => {
      const modal = document.getElementById("editor-modal");
      if (event.target === modal) {
        ModalEditor.close(true);
      }
    });
    document.getElementById("node-type").addEventListener("change", function () {
      if (window.htmlEditor) {
        this.value === "QUIZ"
          ? window.htmlEditor.setOption("mode", "htmlmixed")
          : window.htmlEditor.setOption("mode", "text/plain");
      }
    });
    const storyId = Number(document.getElementById("story-id").textContent);
    const editor = new GraphEditor(storyId);
    editor.init();
  });
})();
