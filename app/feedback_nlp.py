from textblob import TextBlob
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

STOP_WORDS = set(stopwords.words("english"))

def analyze_feedback(text: str) -> dict:
    if not text.strip():
        return {
            "polarity": 0.0,
            "subjectivity": 0.0,
            "keywords": []
        }

    blob = TextBlob(text)

    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    tokens = word_tokenize(text.lower())
    keywords = [
        t for t in tokens
        if t.isalpha() and t not in STOP_WORDS
    ]

    return {
        "polarity": polarity,
        "subjectivity": subjectivity,
        "keywords": keywords
    }
