async function nextSentence() {
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
    try {
        document.body.style.backgroundImage = url(json.nodes[number-1].background_img);
    } catch {
        console.error("JSON error in field json.data.background_img\n Got " + json.nodes[number-1].background_img);
    }
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