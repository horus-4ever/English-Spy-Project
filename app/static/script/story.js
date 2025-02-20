async function nextSentence(){
    const url = "http://127.0.0.1:5000/api/stories/1/nodes"; //+ String(number);
    console.log(url);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    
    const node_type = json.nodes[number-1].node_type;
    const content = document.querySelector(".text");
    if (node_type != "QUIZ"){
        try {
            content.innerHTML = json.nodes[number-1].content;
        } catch {
            console.error("JSON error in field json.nodes[number-1].content\n Got " + json.nodes[number-1].content);
        }
    } else {
        content.innerHTML = "";
        implementQuizContent(json.nodes[number-1].content);
    }
    
    const left_img = document.querySelector("#p1");
    try {
        left_img.src = json.nodes[number-1].left_img; 
    } catch {
        console.error("JSON error in field json.nodes[number-1].left_img\n Got " + json.nodes[number-1].left_img);
    }


    const right_img = document.querySelector("#p2");
    try {
        right_img.src = json.nodes[number-1].right_img;
    } catch {
        console.error("JSON error in field json.nodes[number-1].right_img\n Got " + json.nodes[number-1].right_img);
    }

    const speaker = document.querySelector(".speaker");
    try {
        speaker.innerHTML = json.nodes[number-1].speaker;
    } catch {
        console.error("JSON error in field json.nodes[number-1].speaker\n Got " + json.nodes[number-1].speaker);
    }
    /*try {
        document.body.style.backgroundImage = url(json.nodes[number-1].background);
    } catch {
        console.error("JSON error in field json.data.background\n Got " + json.nodes[number-1].background);
    }*/

    // change the id for the next story
    if (json.nodes[number-1].type != "END"){
        const url_edges = "http://127.0.0.1:5000/api/stories/1/edges";
        const rep = await fetch(url_edges);
        if (!rep.ok){
            throw new Error("HTTP error " + rep.status);
        }
        json_number = await rep.json();
        for (let i=0;i<json_number.edges.length;i++){
            if (json_number.edges[i].from  == number){
                number = json_number.edges[i].to;
                break;
            }
        }
        console.log("number = ",number);
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