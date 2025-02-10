async function myFunction(){
    const response = await fetch("http://127.0.0.1:5000/api/stories/nodes/1");
    if(!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    const element = document.querySelector("#text");
    element.innerHTML = json.data.content;
}