from app.extensions import db
from app.models import *

def populate():
    story = Story(title="Test Story", description="This is a test story")
    # start node
    start_node = StoryNode(
        node_type="START",
        content="this is the story of a man named Stanley.",
        story_id=1, speaker="Narator",
        left_img="p1.png",
        right_img="p2.png",
        background_img="joli_paysage.jpg"
    )
    end_node = StoryNode(
        node_type="END",
        content="And this is how ended the story.",
        story_id=1,
        speaker="Narator",
        left_img="p1.png",
        right_img="p2.png",
        background_img="joli_paysage.jpg"
    )
    some_node = StoryNode(
        node_type="DIALOG",
        content="Hello, ready to do some exercices ?",
        story_id=1,
        speaker="Narator",
        left_img="p2.png",
        right_img="p1.png",
        background_img="joli_paysage.jpg"
    )
    some_quiz = StoryNode(
        node_type="QUIZ",
        content="<div><p> what is the first greek letter ? </p><quiz solution='alpha' ><quizchoice> </quizchoice> <quizchoice> alpha </quizchoice> <quizchoice> beta </quizchoice></quiz></div>",
        story_id=1,
        speaker="Dora",
        left_img="p1.png", 
        right_img="p2.png",
        background_img="joli_paysage.jpg"
    )
    some_quiz2 = StoryNode(
        node_type="QUIZ",
        content="<div><p> What is the Henri IV's horse color ? </p><quiz solution='white' ></quiz><p> Spoiler, it's white </p></div>",
        story_id=1,
        speaker="Dora",
        left_img="p1.png",
        right_img="p2.png",
        background_img="joli_paysage.jpg"
    )
    db.session.add(story)
    db.session.add(start_node)
    db.session.add(end_node)
    db.session.add(some_node)
    db.session.add(some_quiz)
    db.session.add(some_quiz2)
    db.session.commit()

    edge_one = StoryEdge(from_node_id=start_node.id, to_node_id=some_node.id, condition="SUCCESS")
    edge_two = StoryEdge(from_node_id=some_node.id, to_node_id=some_quiz.id, condition="SUCCESS")
    edge_three = StoryEdge(from_node_id=some_quiz.id, to_node_id=some_quiz2.id, condition="SUCCESS")
    edge_four = StoryEdge(from_node_id=some_quiz2.id, to_node_id=end_node.id, condition="SUCCESS")
    
    db.session.add(edge_one)
    db.session.add(edge_two)
    db.session.add(edge_three)
    db.session.add(edge_four)
    db.session.commit()