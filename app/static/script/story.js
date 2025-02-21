/**
 * Global StoryReader instance.
 * @type {StoryReader|null}
 */
let storyReader = null;

/**
 * Global StoryUser instance.
 * @type {StoryUser|null}
 */
let user = null;

document.addEventListener("DOMContentLoaded", async () => {
    const storyID = Number.parseInt(document.querySelector("#storyID").textContent, 10);
    storyReader = new StoryReader();
    user = new StoryUser(storyID);
    await storyReader.loadStory(storyID);
    await user.fetchUserData();
});

/**
 * Returns the current StoryReader instance.
 * @returns {StoryReader|null}
 */
const getReader = () => storyReader;

/**
 * Returns the current StoryUser instance.
 * @returns {StoryUser|null}
 */
const getUser = () => user;


/**
 * Class representing a user within a story context.
 *
 * This class manages the user’s data such as health and progress,
 * and updates a visual health bar element on the page. It fetches user
 * data from an API endpoint, adjusts the health on wrong answers, and renders
 * the current state to the health bar.
 */
class StoryUser {
    /**
     * Creates an instance of StoryUser.
     *
     * @param {string|number} storyID - The unique identifier for the story/user.
     */
    constructor(storyID) {
        this.storyID = storyID;
        this.healthBar = document.getElementById("myRange");
        this.health = 0;
        this.progress = null;
    }

    /**
     * Fetches user data from the API and updates the health and progress properties.
     *
     * The method constructs the API URL using the storyID, makes an asynchronous
     * request, parses the JSON response, and sets the corresponding properties.
     * If an error occurs during the fetch, it logs the error to the console.
     *
     * After updating the data, the render method is called to update the UI.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the data has been fetched and rendered.
     */
    async fetchUserData() {
        const url = `/api/userinfo/${this.storyID}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.health = data["health"];
            this.progress = data["progress"];
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        this.render();
    }

    /**
     * Updates the user's progress.
     *
     * @param {*} nodeID - An identifier for the current progress node.
     */
    setProgress(nodeID) {
        this.progress = nodeID;
    }

    /**
     * Processes a wrong answer by decrementing the user's health.
     *
     * Decreases the health property by 10 points and then updates the UI by calling render.
     */
    wrongAnswer() {
        this.health -= 10;
        this.render();
    }

    /**
     * Renders the current user state to the UI.
     *
     * Updates the health bar's value to reflect the current health of the user.
     * It assumes that the health bar element supports a "value" property (e.g., an <input> of type range).
     */
    render() {
        this.healthBar.value = this.health;
    }
}


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
        if (!response.ok) {
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
        if (!response.ok) {
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
        if (this.currentNode["type"] == "QUIZ") {
            this.contentSection.innerHTML = "";
            const quizParser = new QuizParser(this.currentNode["content"]);
            quizParser.implementQuizContent(this.contentSection);
        } else {
            this.contentSection.innerHTML = this.currentNode["content"];
        }
        this.leftImgSection.src = "../static/pictures/" + this.currentNode["left_img"];
        this.rightImgSection.src = "../static/pictures/" + this.currentNode["right_img"];
        this.speakerSection.innerHTML = this.currentNode["speaker"];
        document.body.style.backgroundImage = `url(${"../static/pictures/" + this.currentNode["background_img"]})`;
    }

    /**
     * Moves to the next node and updates the UI.
     */
    async next() {
        let needFetch = true;
        if (this.currentNode["type"] == "QUIZ") {
            if (this.correctAnswer() && this.nextNodesID.length > 0) {
                this.currentNodeID = this.nextNodesID[0];
            } else {
                needFetch = false;
            }
        } else if (this.currentNode["type"] != "END" && this.nextNodesID.length > 0) {
            this.currentNodeID = this.nextNodesID[0]; // take the first one, for the moment
        }
        if(needFetch) { // fetch the data only if we changed
            await this.fetchData();
        }
        
    }

    correctAnswer() {
        const allQuiz = this.contentSection.querySelectorAll(".quiz-question");
        let result = true;
        for (let quiz of allQuiz) {
            const answer = quiz.getAttribute("solution");
            const userAnswer = quiz.value;
            if (answer !== userAnswer) {
                quiz.classList.add("quiz-error");
                result = false;
            } else {
                quiz.classList.remove("quiz-error");
            }
        };
        if(!result) { // display a modal box
            getUser().wrongAnswer();
            document.getElementById('wrong-modal').style.display = 'block';
        }
        return result;
    }


}


/**
 * Class representing a quiz parser.
 *
 * This class is responsible for converting a custom HTML string that contains quiz-specific tags
 * (such as <QUIZ> elements and nested <quizchoice> elements) into standard HTML elements.
 * It parses the content, processes quiz-specific nodes based on their attributes, and appends
 * the resulting HTML nodes to a given container (content zone).
 */
class QuizParser {
    /**
     * Creates an instance of QuizParser.
     *
     * @param {string} content - The HTML string content containing quiz elements.
     */
    constructor(content) {
        this.content = content;
    }

    /**
     * Parses the provided HTML content and appends the transformed nodes to the specified content zone.
     *
     * The method:
     * - Creates a new DOMParser instance and converts the HTML string into a document.
     * - Selects the child nodes of the first <div> element in the parsed document.
     * - Iterates over each node:
     *   - If the node is a custom <QUIZ> element, it extracts the "solution" attribute,
     *     calls the appropriate parsing method based on its type, sets the "solution" attribute,
     *     and adds a CSS class "quiz-question" for styling purposes.
     *   - Otherwise, it simply imports the node into the current document.
     * - Finally, each new node is appended to the provided contentZone element.
     *
     * @param {HTMLElement} contentZone - The container element to which the parsed quiz content will be appended.
     */
    implementQuizContent(contentZone) {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(this.content, 'text/html');
        const quizNodes = htmlDoc.querySelectorAll("quiz");
        const nodes = htmlDoc.getElementsByTagName('div')[0].childNodes;
        quizNodes.forEach((node, index) => {
            let newHtmlNode = null;
            const answer = node.getAttribute("solution");
            newHtmlNode = this.parseQuizContent(node);
            newHtmlNode.setAttribute("solution", answer);
            newHtmlNode.classList.add("quiz-question");
            node.replaceWith(newHtmlNode);
        });
        nodes.forEach((node, index) => {
            const newHtmlNode = document.importNode(node, true);
            contentZone.appendChild(newHtmlNode);
        })
    }

    /**
     * Parses a quiz node by determining its type and delegating to the appropriate parser.
     *
     * The method checks the "type" attribute of the provided quiz node:
     * - If the type is "multichoice", it calls parseMultipleChoice.
     * - Otherwise, it defaults to calling parseTextInput.
     *
     * @param {HTMLElement} node - The custom quiz node to parse.
     * @returns {HTMLElement} - The resulting HTML element after parsing.
     */
    parseQuizContent(node) {
        const quizKind = node.getAttribute("type");
        switch (quizKind) {
            case "multichoice":
                return this.parseMultipleChoice(node);
            default:
                return this.parseTextInput(node);
        }
    }

    /**
     * Parses a quiz node of type "multichoice" and converts it into a <select> element.
     *
     * The method:
     * - Creates a new <select> element.
     * - Queries all child elements with the tag name "quizchoice" from the quiz node.
     * - Iterates over each <quizchoice> element, creates an <option> element, sets its text content,
     *   and appends it to the <select> element.
     *
     * @param {HTMLElement} node - The custom quiz node of type "multichoice".
     * @returns {HTMLElement} - The generated <select> element with corresponding <option> children.
     */
    parseMultipleChoice(node) {
        const result = document.createElement("select");
        const children = node.querySelectorAll("quizchoice");
        children.forEach(child => {
            const option = document.createElement("option");
            option.textContent = child.textContent;
            result.appendChild(option);
        });
        return result;
    }

    /**
     * Parses a quiz node with unspecified or text input type and converts it into an <input> element.
     *
     * This is the default parser used when the quiz type is not "multichoice".
     *
     * @param {HTMLElement} node - The custom quiz node to parse.
     * @returns {HTMLElement} - The generated <input> element.
     */
    parseTextInput(node) {
        const result = document.createElement("input");
        return result;
    }
}
