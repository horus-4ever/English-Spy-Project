async function nextSentence(){
    const url = "http://127.0.0.1:5000/api/stories/nodes/1/edges" //+ String(number);
    console.log(url);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    
    const content = document.querySelector(".text");
    try {
        content.innerHTML = json.data.content;
    } catch {
        console.error("JSON error in field json.data.content\n Got " + json.data.content);
    }
    
    const left_img = document.querySelector("#p1");
    try {
        left_img.src = json.data.left_img; 
    } catch {
        console.error("JSON error in field json.data.left_img\n Got " + json.data.left_img);
    }


    const right_img = document.querySelector("#p2");
    try {
        right_img.src = json.data.right_img;
    } catch {
        console.error("JSON error in field json.data.right_img\n Got " + json.data.right_img);
    }

    const speaker = document.querySelector(".speaker");
    try {
        speaker.innerHTML = json.data.speaker;
    } catch {
        console.error("JSON error in field json.data.speaker\n Got " + json.data.speaker);
    }
    try {
        document.body.style.backgroundImage = url(json.data.background);
    } catch {
        console.error("JSON error in field json.data.background\n Got " + json.data.background);
    }
    if (json.data.type != "END"){
        number = json.next[0].to;
        console.log(number);
    }
}