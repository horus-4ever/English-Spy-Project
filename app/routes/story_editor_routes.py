from flask import Blueprint, render_template, request, session, redirect, flash
from app.models.story import Story
from app.utils import require_auth
from app.services.stories_service import create_new_empty_story

bp = Blueprint('story_editor', __name__, url_prefix="/editor")

@bp.route("/<int:story_id>", methods=["GET"])
@require_auth
def editor(story_id: int):
    """
    This route will render the visual story editor for a specific story.
    """
    return render_template("story_editor.html", story_id=story_id)


@bp.route("/new", methods=["GET"])
@require_auth
def new():
    """
    This route will create a new story then redirect to `/editor/<story_id>` with the new id
    """
    story: Story = create_new_empty_story()
    story_id: int = story.id
    return redirect(f"/editor/{story_id}")
