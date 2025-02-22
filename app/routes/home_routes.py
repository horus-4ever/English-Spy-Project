from flask import Blueprint, render_template
from app.models.story import Story
from app.services.stories_service import get_all_stories  # Adjust import as needed

bp = Blueprint('home', __name__)

@bp.route("/")
def home():
    stories: list[Story] = get_all_stories()  # Retrieve all available stories
    return render_template("index.html", stories=stories)