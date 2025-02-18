from flask import Blueprint, render_template
from app.services.stories_service import get_all_stories  # Adjust import as needed

bp = Blueprint('home', __name__)

@bp.route("/")
def home():
    stories = get_all_stories()  # Retrieve all available stories
    return render_template("index.html", stories=stories)

@bp.route("/admin")
def admin():
    return render_template("admin.html")