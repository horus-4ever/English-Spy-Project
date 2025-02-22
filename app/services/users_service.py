from app.models import User, UserStory, Story, StoryNode
from app.extensions import bcrypt, db
from app.services.stories_service import get_start_node


def get_user_by_id(user_id: int) -> User:
    """
    Retrieve a user by their unique identifier.

    Args:
        user_id (int): The unique identifier of the user.

    Returns:
        User: The User instance if found; otherwise, None.

    Example:
        >>> user = get_user_by_id(1)
    """
    user: User | None = User.query.get(user_id)
    return user


def create_user(username: str, password: str) -> None:
    """
    Create a new user with the given username and password.

    This function hashes the provided password, creates a new User instance,
    and commits it to the database.

    Args:
        username (str): The desired username for the new user.
        password (str): The plaintext password for the new user.

    Returns:
        None

    Side Effects:
        A new user record is added to the database and the session is committed.

    Example:
        >>> create_user("john_doe", "secure_password123")
    """
    password_hash = bcrypt.generate_password_hash(password)
    user: User = User(username=username, password=password_hash)
    db.session.add(user)
    db.session.commit()


def delete_user(user_id: int) -> None:
    """
    Delete a user by their unique identifier.

    This function removes the user record from the database.

    Args:
        user_id (int): The unique identifier of the user to delete.

    Returns:
        None

    Side Effects:
        The specified user is removed from the database. Note that this function
        does not commit the deletion; you may need to call db.session.commit() afterwards.

    Example:
        >>> delete_user(1)
    """
    User.query.filter(User.id == user_id).delete()


def user_auth(username: str, password: str) -> int | None:
    """
    Authenticate a user based on the provided username and password.

    This function checks whether a user with the given username exists and
    if the provided password matches the stored hashed password.

    Args:
        username (str): The username of the user.
        password (str): The plaintext password to verify.

    Returns:
        int or None: The user's unique identifier if authentication is successful;
                     otherwise, None.

    Example:
        >>> user_id = user_auth("john_doe", "secure_password123")
    """
    user: User = (User.query
        .filter(User.username == username)
        .one_or_none())
    if user is not None and bcrypt.check_password_hash(user.password, password):
        return user.id


def username_taken(username: str) -> bool:
    """
    Check whether a given username is already taken.

    Args:
        username (str): The username to check for availability.

    Returns:
        bool: True if the username exists in the database; False otherwise.

    Example:
        >>> if username_taken("john_doe"):
        ...     print("Username already in use.")
    """
    count: int = User.query.filter(User.username == username).count()
    return count != 0


def update_user_progress(user_id: int, story_node_id: int) -> None:
    """
    Update the progress of a user in a story.

    **Note:** This function is currently a placeholder and needs to be implemented.

    Args:
        user_id (int): The unique identifier of the user.
        story_node_id (int): The unique identifier of the story node representing the new progress.

    Returns:
        None

    Example:
        >>> update_user_progress(1, 5)
    """
    pass


def add_story_to_user(user_id: int, story_id: int) -> None:
    """
    Associate a story with a user by creating a new UserStory record.

    This function determines the starting node of the story (using get_start_node)
    and creates a new UserStory instance linking the user and the story, initializing
    the user's progress at the starting node.

    Args:
        user_id (int): The unique identifier of the user.
        story_id (int): The unique identifier of the story to be followed by the user.

    Returns:
        None

    Side Effects:
        A new UserStory record is added to the database and the session is committed.

    Example:
        >>> add_story_to_user(1, 2)
    """
    start_node: StoryNode = get_start_node(story_id)
    user_story = UserStory(user_id=user_id, story_id=story_id, progress=start_node.id)
    db.session.add(user_story)
    db.session.commit()


def user_reads_story(user_id: int, story_id: int) -> bool:
    """
    Check if a user is currently following a given story.

    Args:
        user_id (int): The unique identifier of the user.
        story_id (int): The unique identifier of the story to check.

    Returns:
        bool: True if a UserStory record exists for the given user and story; False otherwise.

    Example:
        >>> if user_reads_story(1, 2):
        ...     print("User is reading this story.")
    """
    return UserStory.query.get((user_id, story_id)) is not None


def get_user_story_info(user_id: int, story_id: int) -> UserStory:
    """
    Retrieve the UserStory record that links a user to a story.

    Args:
        user_id (int): The unique identifier of the user.
        story_id (int): The unique identifier of the story.

    Returns:
        UserStory: The UserStory record containing details about the user's progress
                   and other related information for the story.

    Example:
        >>> user_story_info = get_user_story_info(1, 2)
    """
    return UserStory.query.get((user_id, story_id))


def update_user_story_info(user_id: int, story_id: int, **data) -> None:
    """
    Update the user-specific story information for a given user and story.

    This function updates fields such as health and progress in the UserStory record.

    Args:
        user_id (int): The unique identifier of the user whose information is to be updated.
        story_id (int): The unique identifier of the story associated with the UserStory record.
        **data: Arbitrary keyword arguments representing the fields to update.
                Expected keys include "health" and "progress".

    Returns:
        None

    Side Effects:
        The UserStory record is updated in the database and the session is committed.

    Example:
        >>> update_user_story_info(1, 2, health=80, progress=10)
    """
    information: UserStory = get_user_story_info(user_id, story_id)
    information.health = data.get("health", information.health)
    information.progress = data.get("progress", information.progress)
    db.session.commit()
