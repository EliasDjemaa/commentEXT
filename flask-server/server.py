from flask import Flask, request
from flask_cors import CORS  # Import CORS
from googleapiclient.discovery import build
import spacy
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Replace 'YOUR_API_KEY' with your actual YouTube Data API key
API_KEY = 'AIzaSyCX5YqSlDq5mCWgXkOG7naRM_JXcgNV3FQ'

# loading a more accurate model - previous model was really poor at detecting Q or A - however this pipeline is larger and slower 
nlp = spacy.load("en_core_web_md")

# Function to fetch comments using YouTube Data API v3
def get_video_comments(api_key, video_id):
    youtube = build('youtube', 'v3', developerKey=api_key)

    # Retrieve comments for the specified video
    comments = []
    nextPageToken = None

    print('Fetching comments:', video_id)

    while True:
        response = youtube.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=100,  # Adjust as needed
            order='relevance',
            textFormat='plainText',
            pageToken=nextPageToken
        ).execute()

        for item in response.get('items', []):
            comment = item['snippet']['topLevelComment']['snippet']['textDisplay']
            comments.append(comment)

        nextPageToken = response.get('nextPageToken')

        if not nextPageToken:
            break

    return comments

# Function to analyze comments using spaCy
def analyze_comments(comments):
    analyzed_comments = []

    for comment in comments:
        # Check if the comment contains a question mark using regex
        is_question_regex = re.search(r'\?', comment)

        # Combine the results
        is_question = is_question_regex is not None

        # Check if the comment contains a solution or answer
        doc = nlp(comment)
        is_solution = any(token.text.lower() in ['solution', 'answer'] for token in doc)

        # Include the comment only if it's a question and not a solution
        if is_question and not is_solution:
            analyzed_comments.append({
                'comment': comment,
                'is_question': is_question,
                'is_solution': is_solution
            })

    return analyzed_comments

# Endpoint to handle incoming video ID
@app.route('/', methods=['POST'])
def handle_request():
    data = request.get_json()
    video_id = data.get('videoId')

    print('Received Video ID:', video_id)

    # Fetch comments using YouTube Data API
    video_comments = get_video_comments(API_KEY, video_id)

    # Analyze comments using modified spaCy function
    analyzed_comments = analyze_comments(video_comments)

    return {'success': True, 'comments': analyzed_comments}

if __name__ == '__main__':
    app.run(debug=True)
