from flask import Blueprint
from app.api.ressources.stories_ressource import *
from app.api.ressources.users_ressource import *

api_bp = Blueprint("api", __name__)

api_bp.add_url_rule("/stories", view_func=StoriesRessource.as_view("stories"))
api_bp.add_url_rule("/stories/<int:id>", view_func=StoryDetailRessource.as_view("story"))
api_bp.add_url_rule("/stories/<int:story_id>/nodes", view_func=StoryNodesRessource.as_view("story_nodes"))
api_bp.add_url_rule("/stories/nodes/<int:id>", view_func=StoryNodeDetailRessource.as_view("story_node_detail"))

api_bp.add_url_rule("/stories/<int:story_id>/edges", view_func=StoryEdgesRessource.as_view("story_edges"))


api_bp.add_url_rule("/users/new", view_func=UserRessource.as_view("new_user"))
api_bp.add_url_rule("/users/<int:user_id>", view_func=UserDetailRessource.as_view("user"))