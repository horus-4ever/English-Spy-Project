async function myFunction(){
    const url = "http://127.0.0.1:5000/api/stories/nodes/" + String(number);
    console.log(url);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    
    const content = document.querySelector("#text");
    content.innerHTML = json.data.content;
    
    const left_img = document.querySelector("#p1");
    left_img.innerHTML = json.data.left_img;

    const right_img = document.querySelector("#p2");
    right_img.innerHTML = json.data.right_img;

    const speaker = document.querySelector("#speaker");
    speaker.innerHTML = json.data.speaker;

    const background = document.getElementsByClassName("body").background-image;
    background = url(json.data.background);
    number = json.next[0].to;
    console.log(number);
}