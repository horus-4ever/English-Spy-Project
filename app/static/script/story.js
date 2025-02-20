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
    
    var newForm = document.createElement("form");
    newForm.id = "questions";
    newForm.method = "POST";
    // Append it to the 'content' div
    document.getElementById("text").appendChild(newForm);
    let old_i = 0;
    let nb_q = 0;
    for (let i=0;i<content.length;i++){
        if (content[i]=='!' && content[i+1]=='<'){
            nb_q++;
            if (old_i != i-1 && i!=0){
                let text = String(content).substring(old_i,i-1);
                var newParagraph = document.createElement("label");
                newParagraph.textContent = text;
                newParagraph.htmlFor = "Q"+nb_q;
                // Append it to the form
                document.getElementById("questions").appendChild(newParagraph);
            }
            var newQuiz = document.createElement("input");
            newQuiz.type="text";
            newQuiz.name="Q"+nb_q;
            document.getElementById("questions").appendChild(newQuiz);
            i+=2;
            old_i=i;
        }
    }
    if (old_i != content.length && content.length!=0){
        var newParagraph = document.createElement("div");
        newParagraph.textContent = String(content).substring(old_i,content.length);
        document.getElementById("questions").appendChild(newParagraph);
    }
}