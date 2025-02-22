from flask import Blueprint, render_template, request, session, redirect, flash
from app.models.story import Story
from app.models.user import User
from app.services.stories_service import get_story_by_id
from app.services.users_service import add_story_to_user, get_user_by_id, user_reads_story
from app.utils import require_auth

bp = Blueprint('story_read', __name__, url_prefix="/read")

@bp.route("/<int:story_id>", methods=["GET"])
@require_auth
def read(story_id: int):
    """
    This route will render the visual story.
    """
    user_id: int = session["user_id"]
    if not user_reads_story(user_id, story_id):
        add_story_to_user(user_id, story_id)
    return render_template("read.html", story_id=story_id, user_id=user_id)
