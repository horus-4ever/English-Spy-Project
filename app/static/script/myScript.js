async function myFunction(){
    const url = "http://127.0.0.1:5000/api/stories/nodes/" + String(number);
    console.log(url);
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    const element = document.querySelector("#text");
    element.innerHTML = json.data.content;
    number = json.next[0].to;
    console.log(number);
}