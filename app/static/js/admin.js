function changeP1(){
    document.getElementById('fileInputLeft').click();
    document.getElementById('fileInputLeft').addEventListener('change', function(event) {
        const file = event.target.files[0];  // Get the first selected file
        if (file) {
            console.log("File selected:", file.name);
            document.querySelector("#p1").src="../static/pictures/" + file.name;
        // You can now handle the file, for example, display its contents or send it to a server
        }
    });
}

function changeP2(){
    document.getElementById('fileInputRight').click();
    document.getElementById('fileInputRight').addEventListener('change', function(event) {
        const file = event.target.files[0];  // Get the first selected file
        if (file) {
            console.log("File selected:", file.name);

        // You can now handle the file, for example, display its contents or send it to a server
        }
    });
}

function writeText(){}

function changeBackground(){}