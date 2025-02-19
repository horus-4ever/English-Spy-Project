from app.extensions import db
from app.models import *

def populate():
    story = Story(title="Test Story", description="This is a test story")
    # start node
    start_node = StoryNode(
        node_type="START",
        content="this is the story of a man named Stanley.",
        story_id=1, speaker="Narator",
        left_img="../static/pictures/p1.png",
        right_img="../static/pictures/p2.png",
        background_img="../static/pictures/joli_paysage.jpg"
    )
    end_node = StoryNode(
        node_type="END",
        content="And this is how ended the story.",
        story_id=1,
        speaker="Narator",
        left_img="../static/pictures/p1.png",
        right_img="../static/pictures/p2.png",
        background_img="../static/pictures/joli_paysage.jpg"
    )
    some_node = StoryNode(
        node_type="DIALOG",
        content="Hello World!",
        story_id=1,
        speaker="Narator",
        left_img="../static/pictures/p2.png",
        right_img="../static/pictures/p1.png",
        background_img="../static/pictures/joli_paysage.jpg"
    )

    db.session.add(story)
    db.session.add(start_node)
    db.session.add(end_node)
    db.session.add(some_node)
    db.session.commit()

    edge_one = StoryEdge(from_node_id=start_node.id, to_node_id=some_node.id, condition="SUCCESS")
    edge_two = StoryEdge(from_node_id=some_node.id, to_node_id=end_node.id, condition="SUCCESS")

    db.session.add(edge_one)
    db.session.add(edge_two)
    db.session.commit()