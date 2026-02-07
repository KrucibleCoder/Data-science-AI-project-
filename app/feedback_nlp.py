from textblob import TextBlob
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

STOP_WORDS = set(stopwords.words("english"))


def analyze_feedback(text: str) -> dict:
    blob = TextBlob(text)

    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    tokens = word_tokenize(text.lower())
    keywords = [
        w for w in tokens
        if w.isalpha() and w not in STOP_WORDS
    ]

    return {
        "polarity": polarity,
        "subjectivity": subjectivity,
        "keywords": keywords
    }
