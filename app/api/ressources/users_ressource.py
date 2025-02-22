from flask.views import MethodView
from flask import jsonify, request, session
from app.models.user_story import UserStory
from app.services.users_service import create_user, get_user_story_info, update_user_story_info


class UserRessource(MethodView):
    """
    User Resource for handling user creation.

    This view handles the creation of new users. It expects a JSON payload containing
    a 'username' and 'password'. Upon successful creation, the user record is added to the
    database. No response data is returned by default.
    """

    def put(self):
        """
        Create a new user.

        HTTP Method: PUT
        Endpoint: /api/users

        Request JSON body:
            {
                "username": "<desired_username>",
                "password": "<plaintext_password>"
            }

        Side Effects:
            - Calls the create_user service function to hash the password,
              create a new user record, and commit it to the database.

        Returns:
            A JSON response indicating the outcome of the creation. In this sample,
            no data is returned; consider returning an appropriate status message.
            
        Example:
            PUT /api/users
            {
                "username": "john_doe",
                "password": "secure_password123"
            }
        """
        request_data = request.json
        username = request_data["username"]
        password = request_data["password"]
        create_user(username, password)
        return jsonify({"message": "User created successfully"}), 201


class UserDetailRessource(MethodView):
    """
    User Detail Resource for retrieving individual user information.

    This view is designed to fetch user details by their unique identifier.
    Currently, the implementation is pending.
    """

    def get(self, user_id: int):
        """
        Retrieve the user information for a given user ID.

        HTTP Method: GET
        Endpoint: /api/users/<user_id>

        Args:
            user_id (int): The unique identifier of the user.

        Returns:
            JSON response containing the user details.
            (Currently, this is a placeholder for future implementation.)

        Example:
            GET /api/users/1
        """
        # Implementation pending. Expected to retrieve user details.
        pass


class UserStoryRessource(MethodView):
    """
    User Story Resource for handling user-story associations.

    This view handles operations related to the UserStory model. It allows retrieval
    and updating of a user's progress or other information associated with a specific story.
    The user's ID is obtained from the session.
    """

    def get(self, story_id: int):
        """
        Retrieve the user-story information for the current user and a specific story.

        HTTP Method: GET
        Endpoint: /api/users/stories/<story_id>

        The function extracts the user_id from the session, then uses the get_user_story_info
        service to fetch the associated UserStory record. The record is serialized and returned as JSON.

        Args:
            story_id (int): The unique identifier of the story.

        Returns:
            tuple: A JSON response containing the serialized user-story data and an HTTP status code 200.

        Example:
            GET /api/users/stories/2
            Response:
            {
                "user_id": 1,
                "story_id": 2,
                "progress": 5,
                "health": 100,
                ...
            }
        """
        user_id: int = session["user_id"]
        data: UserStory = get_user_story_info(user_id, story_id)
        return jsonify(data.serialize()), 200

    def put(self, story_id: int):
        """
        Update the user-story information for the current user and a specific story.

        HTTP Method: PUT
        Endpoint: /api/users/stories/<story_id>

        This function extracts the user_id from the session and expects a JSON payload
        containing fields to update (for example, 'progress' or 'health'). It then calls
        the update_user_story_info service to commit the changes to the database.

        Args:
            story_id (int): The unique identifier of the story.

        Request JSON body example:
            {
                "progress": 10,
                "health": 80
            }

        Returns:
            tuple: A JSON response confirming the update and an HTTP status code 200.

        Example:
            PUT /api/users/stories/2
            {
                "progress": 10,
                "health": 80
            }
        """
        user_id: int = session["user_id"]
        data = request.get_json()
        update_user_story_info(user_id, story_id, **data)
        return jsonify({"message": "User story information updated successfully"}), 200