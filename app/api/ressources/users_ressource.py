from flask.views import MethodView
from flask import jsonify, request
from app.services.users_service import create_user


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