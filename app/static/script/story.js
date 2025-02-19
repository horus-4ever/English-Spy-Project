async function nextSentence() {
    const url = "http://127.0.0.1:5000/api/stories/1/nodes"; //+ String(number);
    console.log(url);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    
    const content = document.querySelector(".text");
    try {
        content.innerHTML = json.nodes[number-1].content;
    } catch {
        console.error("JSON error in field json.nodes[number-1].content\n Got " + json.nodes[number-1].content);
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