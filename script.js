document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.querySelector('input[type="submit"]');
    let videoId;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentUrl = tabs[0].url;
        videoId = getYouTubeVideoId(currentUrl);
        console.log('Current YouTube Video ID:', videoId);

        chrome.runtime.sendMessage({ action: "getVideoInfo", videoId }, function(response) {
            // Check if the connection is still active before processing the response
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            } else if (response && response.success) {
                const videoInfo = response.videoInfo;
                console.log('Video Title:', videoInfo.title);
            } else {
                console.error('Error:', response ? response.error : 'No response');
            }
        });
    });

    submitButton.addEventListener('click', function (event) {
        event.preventDefault();

        const apiUrl = 'http://127.0.0.1:5000';

        // Get the total number of comments before making the actual requests
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.comments)) {
                console.log('Received Comments:', data.comments); // Log received comments

                const totalComments = data.comments.length;
                let analyzedComments = 0;

                // Display progress bar
                const progressBar = document.getElementById('progress');
                progressBar.style.width = '0%';

                // Analyze comments
                data.comments.forEach(commentObj => {
                    analyzeComment(commentObj).then(() => {
                        analyzedComments++;

                        // Update progress bar
                        const percentage = (analyzedComments / totalComments) * 100;
                        progressBar.style.width = percentage + '%';

                        // Check if all comments are analyzed
                        if (analyzedComments === totalComments) {
                            console.log('Analysis Complete!');
                            renderComments(data.comments); // Render comments after analysis
                        }
                    });
                });
            } else {
                console.error('Error:', data.error);
            }                
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    function getYouTubeVideoId(url) {
        const regex = /[?&]v=([^?&]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    function analyzeComment(commentObj) {
        // Simulate asynchronous comment analysis
        return new Promise(resolve => {
            setTimeout(() => {
                // Your comment analysis logic here
                console.log('Analyzing comment:', commentObj.comment);
                resolve();
            }, 100); // Simulating delay for illustration purposes
        });
    }

    function renderComments(comments) {
        const QACommentsDiv = document.querySelector('.QAcomments');
        QACommentsDiv.innerHTML = ''; // Clear existing comments

        comments.forEach(commentObj => {
            if (commentObj.is_question || commentObj.is_solution) {
                const commentElement = document.createElement('p');
                commentElement.textContent = commentObj.comment;
                QACommentsDiv.appendChild(commentElement);
            }
        });
    }
});
