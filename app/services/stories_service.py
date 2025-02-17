from app.models import Story, StoryNode, StoryEdge


def get_all_stories() -> list[object]:
    """Retrieve all the stories"""
    stories: list[Story] = Story.query.all()
    return [story.serialize() for story in stories]


def get_story(story_id: int) -> object:
    """Retrieve a story by ID"""
    story: Story = Story.query.get(story_id)
    return story.serialize()


def get_story_node(story_node_id: int) -> object:
    """Retrieve a story node by ID"""
    node: StoryNode | None = StoryNode.query.get(story_node_id)
    if not node:
        return None
    return node.serialize()


def get_next_nodes(story_node_id: int) -> list[object]:
    """Get the next nodes of the story"""
    next_nodes: list[StoryEdge] | None = StoryEdge.query.filter(StoryEdge.from_node_id.is_(story_node_id)).all()
    return [node.serialize() for node in next_nodes]


def get_start_node(story_id: int) -> StoryNode:
    """Get the start node of a story"""
    result: StoryNode = (StoryNode.query
        .filter(StoryNode.story_id.is_(story_id), StoryNode.node_type == "START")
        .one())
    return result