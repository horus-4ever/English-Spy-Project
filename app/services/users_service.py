from app.models import User
from app.extensions import bcrypt


def get_user_by_id(user_id: int) -> object:
    """Retrieve a user by ID"""
    user: User | None = User.query.get(user_id)
    return user.serialize()


def update_user_progress(user_id: int, story_node_id: int) -> object:
    """Update the progression of a user in a story"""
    pass


def create_user(username: str, password: str) -> object:
    """Creates a new user"""
    password_hash = bcrypt.generate_password_hash(password)
    User.query.add_column((username, password_hash))


def delete_user(user_id: int) -> object:
    """Delete a user by ID"""
    User.query.filter(User.id == user_id).delete()