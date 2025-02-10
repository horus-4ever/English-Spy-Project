from flask.views import MethodView
from flask import jsonify, request
from app.services.stories_service import get_story_node, get_next_nodes, get_all_stories, get_story


class StoriesRessource(MethodView):
    def get(self) -> object:
        """Get all the stories"""
        stories = get_all_stories()
        return jsonify({ "stories": stories }), 200


class StoryDetailRessource(MethodView):
    def get(self, id: int) -> object:
        """Get a specific story by ID"""
        story = get_story(id)
        return jsonify({ "story": story }), 200


class StoryNodeDetailRessource(MethodView):
    def get(self, id: int) -> object:
        """Get the details of a node in the story graph"""
        node_data = get_story_node(id)
        next_nodes = get_next_nodes(id)
        return jsonify({ "data": node_data, "next": next_nodes }), 200