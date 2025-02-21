from flask.views import MethodView
from flask import jsonify, request, session
from app.models.story import Story
from app.models.user import User
from app.models.user_story import UserStory
from app.services.stories_service import get_story_by_id
from app.services.users_service import create_user, get_user_by_id, get_user_story_info


class UserRessource(MethodView):
    def put(self):
        """Create a new user."""
        request_data = request.json
        username = request_data["username"]
        password = request_data["password"]
        create_user(username, password)


class UserDetailRessource(MethodView):
    def get(self, user_id: int):
        """Get the user information."""
        pass



class UserStoryRessource(MethodView):
    def get(self, story_id: int):
        """Get the user information associated to the story"""
        user_id: int = session["user_id"]
        user: User = get_user_by_id(user_id)
        story: Story = get_story_by_id(story_id)
        data: UserStory = get_user_story_info(user, story)
        return jsonify(data.serialize()), 200