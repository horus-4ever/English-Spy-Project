/**
 * Global StoryReader instance.
 * @type {StoryReader|null}
 */
let storyReader = null;

document.addEventListener("DOMContentLoaded", async () => {
    storyReader = new StoryReader();
    const storyID = Number.parseInt(document.querySelector("#storyID").textContent, 10);
    await storyReader.loadStory(storyID);
});

/**
 * Returns the current StoryReader instance.
 * @returns {StoryReader|null}
 */
const getReader = () => storyReader;


/**
 * Manages story data and updates the UI.
 */
class StoryReader {
    constructor() {
        this.contentSection = document.querySelector("#text");
        this.leftImgSection = document.querySelector("#p1");
        this.rightImgSection = document.querySelector("#p2");
        this.speakerSection = document.querySelector("#speaker");
        this.storyID = null;
        this.currentNodeID = null;
        this.currentNode = null;
        this.nextNodesID = [];
    }

    /**
     * Loads the story by storyID and optionally a specific node.
     * @param {number} storyID 
     * @param {number|null} [nodeID=null] 
     */
    async loadStory(storyID, nodeID = null) {
        this.storyID = storyID;
        this.currentNodeID = nodeID === null ? await this.fetchStartNode() : nodeID;
        await this.fetchData();
    }

    /**
     * Fetches the ID of the start node.
     * @returns {Promise<number>}
     */
    async fetchStartNode() {
        const url = `/api/stories/${this.storyID}/nodes`;
        const response = await fetch(url);
        if(!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        const { nodes } = await response.json();
        const startNode = nodes.find(node => node.node_type === "START");
        if (startNode) {
            return startNode.id;
        }
        throw new Error("Not Found");
    }

    /**
     * Fetches data for the current node and updates the display.
     */
    async fetchData() {
        const url = `/api/stories/nodes/${this.currentNodeID}`;
        const response = await fetch(url);
        if(!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        const json = await response.json();
        // retrieve current node and next nodes id
        this.currentNode = json.data;
        this.nextNodesID = json.next;
        this.display();
    }

    /**
     * Updates the UI elements with the current node's content.
     */
    display() {
        this.contentSection.innerHTML = this.currentNode["content"];
        this.leftImgSection.src = this.currentNode["left_img"];
        this.rightImgSection.src = this.currentNode["right_img"];
        this.speakerSection.innerHTML = this.currentNode["speaker"];
        document.body.style.backgroundImage = `url(${this.currentNode["background_img"]})`;
    }

    /**
     * Moves to the next node and updates the UI.
     */
    async next() {
        if(this.currentNode.node_type !== "END" && this.nextNodesID.length > 0) {
            this.currentNodeID = this.nextNodesID[0]; // take the first one, for the moment
        }
        await this.fetchData();
    }
}

function implementQuizContent(content){
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(content, 'text/html');
    let nodes = htmlDoc.getElementsByTagName('div')[0].childNodes;
    let nb_q=0;
    for (let node of nodes){
        if (node.tagName == "QUIZ"){
            nb_q++;
            if (node.childNodes.length == 0){
                var newQuiz = document.createElement("input");
                newQuiz.id = "Q"+nb_q;
                document.getElementById("text").appendChild(newQuiz);
            } else {
                var newQuiz = document.createElement("select");
                newQuiz.id = "Q"+nb_q;
                document.getElementById("text").appendChild(newQuiz);
                for (let quizchoice of node.childNodes){
                    var newQuizPossibility = document.createElement("option");
                    newQuizPossibility.textContent = quizchoice.textContent;
                    document.getElementById("Q"+nb_q).appendChild(newQuizPossibility);
                }
            }
        } else if (node.tagName == "P"){
            var newElt = document.createElement("div");
            newElt.textContent = node.textContent;
            document.getElementById("text").appendChild(newElt);
        }
    }
    
}