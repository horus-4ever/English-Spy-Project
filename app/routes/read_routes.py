from flask import Blueprint, render_template, request, session, redirect, flash
from app.utils import require_auth

bp = Blueprint('story_read', __name__, url_prefix="/read")

@bp.route("/<int:story_id>", methods=["GET"])
@require_auth
def editor(story_id: int):
    """
    This route will render the visual story.
    """
    return render_template("read.html", story_id=story_id)
