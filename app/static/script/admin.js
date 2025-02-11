function changeP1(){
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // Create a reader to read the file
            const reader = new FileReader();
            reader.onload = function(e) {
                // Show file info and content (if it's text-based)
                document.getElementById('fileInfo').innerHTML = `
                    <p><strong>File Name:</strong> ${file.name}</p>
                    <p><strong>File Type:</strong> ${file.type}</p>
                    <p><strong>File Size:</strong> ${file.size} bytes</p>
                    <p><strong>File Content:</strong></p>
                    <pre>${e.target.result}</pre>
                `;
            };

            // Read the file as text (you could use other methods like readAsDataURL for images)
            reader.readAsText(file);
        }
    });
}

function changeP2(){}

function writeText(){}

function changeBackground(){}