from flask import Blueprint
from app.api.ressources.stories_ressource import StoriesRessource, StoryDetailRessource

api_bp = Blueprint("api", __name__)

api_bp.add_url_rule("/stories", view_func=StoriesRessource.as_view("stories"))
api_bp.add_url_rule("/story<int:id>", view_func=StoryDetailRessource.as_view("story"))