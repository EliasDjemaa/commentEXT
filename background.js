
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "getVideoInfo" && request.videoId) {
        const apiKey = 'AIzaSyCX5YqSlDq5mCWgXkOG7naRM_JXcgNV3FQ';
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${request.videoId}&key=${apiKey}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
            if (data.items && data.items.length > 0) {
                const videoInfo = data.items[0].snippet;
                sendResponse({ success: true, videoInfo });
            } else {
                sendResponse({ success: false, error: 'Video not found.' });
            }
            })
            .catch(error => {
            sendResponse({ success: false, error: 'Error fetching video information.' });
            });

        // Return true to indicate that the response will be asynchronous
        return true;
        }
    }
    );
