async function nextSentence(){
    const url = "http://127.0.0.1:5000/api/stories/nodes/" + String(number);
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
        throw new Error("JSON error in field json.data.content\n Got " + json.data.content);
    }
    
    const left_img = document.querySelector("#p1");
    try {
        left_img.innerHTML = json.data.left_img;
    } catch {
        throw new Error("JSON error in field json.data.left_img\n Got " + json.data.left_img);
    }


    const right_img = document.querySelector("#p2");
    try {
        right_img.innerHTML = json.data.right_img;
    } catch {
        throw new Error("JSON error in field json.data.right_img\n Got " + json.data.right_img);
    }

    const speaker = document.querySelector(".speaker");
    try {
        speaker.innerHTML = json.data.speaker;
    } catch {
        throw new Error("JSON error in field json.data.speaker\n Got " + json.data.speaker);
    }
    const background = document.getElementsByClassName("body").background-image;
    try {
        background = url(json.data.background);
    } catch {
        throw new Error("JSON error in field json.data.background\n Got " + json.data.background);
    }
    number = json.next[0].to;
    console.log(number);
}