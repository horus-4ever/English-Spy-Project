from flask import abort
from app.models import Story, StoryNode, StoryEdge
from app.extensions import db


def get_all_stories() -> list[Story]:
    """
    Retrieve all stories from the database.

    Returns:
        List[Story]: A list containing all Story model instances.

    Example:
        >>> stories = get_all_stories()
    """
    return Story.query.all()


def get_story_by_id(story_id: int) -> Story:
    """
    Retrieve a single story by its unique identifier.

    Args:
        story_id (int): The unique identifier of the story.

    Returns:
        Story: The Story instance corresponding to the given story_id.

    Raises:
        404 Not Found: If no story exists with the provided ID.

    Example:
        >>> story = get_story_by_id(1)
    """
    story = Story.query.get(story_id)
    if not story:
        abort(404, description="Story not found")
    return story


def update_story(story_id: int, data: dict) -> Story:
    """
    Update the details of an existing story.

    Args:
        story_id (int): The unique identifier of the story to update.
        data (dict): A dictionary containing updated fields.
                     Expected keys include "title" and "description".

    Returns:
        Story: The updated Story instance after committing changes.

    Side Effects:
        Commits the updated story to the database.

    Example:
        >>> updated_story = update_story(1, {"title": "New Title", "description": "Updated description"})
    """
    story = get_story_by_id(story_id)
    story.title = data.get("title", story.title)
    story.description = data.get("description", story.description)
    db.session.commit()
    return story


def get_story_nodes(story_id: int) -> list[StoryNode]:
    """
    Retrieve all nodes associated with a specific story.

    Args:
        story_id (int): The unique identifier of the story.

    Returns:
        List[StoryNode]: A list of StoryNode instances that belong to the story.

    Example:
        >>> nodes = get_story_nodes(1)
    """
    return StoryNode.query.filter(StoryNode.story_id == story_id).all()


def create_story_node(story_id: int, data: dict) -> StoryNode:
    """
    Create a new story node for a given story.

    Args:
        story_id (int): The unique identifier of the story to which the node will be added.
        data (dict): A dictionary containing node details.
                     Expected keys include:
                        - "node_type": Type of the node (default is "DIALOG")
                        - "content": The content of the node
                        - "speaker": The speaker associated with the node
                        - "left_img": Left-side image URL or path
                        - "right_img": Right-side image URL or path
                        - "background_img": Background image URL or path

    Returns:
        StoryNode: The newly created StoryNode instance.

    Side Effects:
        The new node is added to the database and the session is committed.

    Example:
        >>> new_node = create_story_node(1, {"content": "Hello World", "speaker": "Narrator"})
    """
    new_node = StoryNode(
        story_id=story_id,
        node_type=data.get("node_type", "DIALOG"),
        content=data.get("content", ""),
        speaker=data.get("speaker", ""),
        left_img=data.get("left_img", ""),
        right_img=data.get("right_img", ""),
        background_img=data.get("background_img", "")
    )
    db.session.add(new_node)
    db.session.commit()
    return new_node


def update_story_node(node_id: int, data: dict) -> StoryNode:
    """
    Update an existing story node with new data.

    Args:
        node_id (int): The unique identifier of the story node to update.
        data (dict): A dictionary containing the updated node information.
                     Possible keys include "node_type", "content", "speaker",
                     "left_img", "right_img", and "background_img".

    Returns:
        StoryNode: The updated StoryNode instance.

    Side Effects:
        Commits the changes to the database.

    Example:
        >>> updated_node = update_story_node(2, {"content": "Updated content"})
    """
    node = StoryNode.query.get_or_404(node_id)
    node.node_type = data.get("node_type", node.node_type)
    node.content = data.get("content", node.content)
    node.speaker = data.get("speaker", node.speaker)
    node.left_img = data.get("left_img", node.left_img)
    node.right_img = data.get("right_img", node.right_img)
    node.background_img = data.get("background_img", node.background_img)
    db.session.commit()
    return node


def delete_story_node(node_id: int):
    """
    Delete a story node from the database.

    Args:
        node_id (int): The unique identifier of the story node to delete.

    Side Effects:
        Removes the node from the database and commits the change.

    Raises:
        404 Not Found: If the node with the specified ID does not exist.

    Example:
        >>> delete_story_node(2)
    """
    node = StoryNode.query.get_or_404(node_id)
    db.session.delete(node)
    db.session.commit()


def get_story_edges(story_id: int) -> list[StoryEdge]:
    """
    Retrieve all edges for a specific story.

    This function returns edges where the starting node (from_node)
    belongs to the story identified by story_id.

    Args:
        story_id (int): The unique identifier of the story.

    Returns:
        List[StoryEdge]: A list of StoryEdge instances associated with the story.

    Example:
        >>> edges = get_story_edges(1)
    """
    return StoryEdge.query.join(StoryNode, StoryEdge.from_node_id == StoryNode.id)\
            .filter(StoryNode.story_id == story_id).all()


def create_story_edge(data: dict) -> StoryEdge:
    """
    Create a new edge between two story nodes.

    Args:
        data (dict): A dictionary containing edge details.
                     Required keys:
                        - "from_node_id": The ID of the starting node.
                        - "to_node_id": The ID of the target node.
                     Optional key:
                        - "condition": The condition for the edge (default is "SUCCESS").

    Returns:
        StoryEdge: The newly created StoryEdge instance.

    Side Effects:
        Adds the new edge to the database and commits the session.

    Example:
        >>> edge = create_story_edge({"from_node_id": 1, "to_node_id": 2})
    """
    new_edge = StoryEdge(
        from_node_id=data["from_node_id"],
        to_node_id=data["to_node_id"],
        condition=data.get("condition", "SUCCESS")
    )
    db.session.add(new_edge)
    db.session.commit()
    return new_edge


def delete_story_edge(from_node_id: int, to_node_id: int):
    """
    Delete an edge between two story nodes from the database.

    Args:
        from_node_id (int): The unique identifier of the starting node of the edge.
        to_node_id (int): The unique identifier of the target node of the edge.

    Side Effects:
        Removes the edge from the database and commits the change.

    Raises:
        404 Not Found: If no edge exists between the specified nodes.

    Example:
        >>> delete_story_edge(1, 2)
    """
    edge = StoryEdge.query.get((from_node_id, to_node_id))
    if not edge:
        abort(404, description="Edge not found")
    db.session.delete(edge)
    db.session.commit()


def get_story_node(story_node_id: int) -> StoryNode:
    """
    Retrieve a single story node by its unique identifier and return its serialized form.

    Args:
        story_node_id (int): The unique identifier of the story node.

    Returns:
        dict or None: A dictionary representing the serialized story node if found;
                      otherwise, None.

    Example:
        >>> node_data = get_story_node(3)
    """
    node: StoryNode | None = StoryNode.query.get(story_node_id)
    if not node:
        return None
    return node.serialize()


def get_next_nodes_id(story_node_id: int) -> list[int]:
    """
    Retrieve the identifiers of all nodes that follow a given story node.

    Args:
        story_node_id (int): The unique identifier of the starting story node.

    Returns:
        List[int]: A list of node IDs representing the 'next' nodes reachable from the given node.

    Example:
        >>> next_ids = get_next_nodes_id(3)
    """
    next_nodes: list[StoryEdge] | None = StoryEdge.query.filter(StoryEdge.from_node_id.is_(story_node_id)).all()
    return [node.to_node_id for node in next_nodes]


def get_start_node(story_id: int) -> StoryNode:
    """
    Retrieve the starting node of a specific story.

    The starting node is identified by having a node_type of "START".

    Args:
        story_id (int): The unique identifier of the story.

    Returns:
        StoryNode: The StoryNode instance marked as the starting node for the story.

    Raises:
        sqlalchemy.orm.exc.NoResultFound: If no starting node is found for the story.

    Example:
        >>> start_node = get_start_node(1)
    """
    result: StoryNode = (StoryNode.query
        .filter(StoryNode.story_id.is_(story_id), StoryNode.node_type == "START")
        .one())
    return result


def create_new_empty_story() -> Story:
    """
    Create a new empty story with default values and an associated starting node.

    This function performs the following steps:
      1. Creates a new Story instance with default values.
      2. Commits the new story to the database.
      3. Creates a new StoryNode instance as the starting node (with node_type "START") for the story.
      4. Commits the starting node to the database.

    Returns:
        Story: The newly created Story instance, which includes its starting node.

    Side Effects:
        Two new records are added to the database: one for the story and one for its starting node.

    Example:
        >>> new_story = create_new_empty_story()
    """
    story: Story = Story.default()
    db.session.add(story)
    db.session.commit()
    story_node: StoryNode = StoryNode.default(story.id, "START")
    db.session.add(story_node)
    db.session.commit()
    return story