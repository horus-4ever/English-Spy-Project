# app/views/stories.py
from flask.views import MethodView
from flask import jsonify, request
from app.services.stories_service import (
    get_all_stories, get_next_nodes_id, get_story_by_id, get_story_node, update_story, 
    get_story_nodes, create_story_node, update_story_node,
    delete_story_node, get_story_edges, create_story_edge,
    delete_story_edge
)

class StoriesResource(MethodView):
    """
    Resource for managing story collections.

    Endpoints:
        GET /api/stories
            Retrieve a list of all stories.
    """
    def get(self) -> object:
        """
        Retrieve all stories from the database.

        HTTP Method: GET
        Endpoint: /api/stories

        Returns:
            tuple: A JSON response with the list of serialized story objects and an HTTP status code 200.

        Example:
            GET /api/stories
            Response:
            {
                "stories": [
                    { "id": 1, "title": "Story One", "description": "..." },
                    { "id": 2, "title": "Story Two", "description": "..." }
                ]
            }
        """
        stories = get_all_stories()
        serialized = [story.serialize() for story in stories]
        return jsonify({"stories": serialized}), 200


class StoryDetailResource(MethodView):
    """
    Resource for managing individual stories.

    Endpoints:
        GET /api/stories/<id>
            Retrieve a specific story by its ID.
        PUT /api/stories/<id>
            Update the details of a specific story.
    """
    def get(self, id: int) -> object:
        """
        Retrieve a specific story by its unique identifier.

        HTTP Method: GET
        Endpoint: /api/stories/<id>

        Args:
            id (int): The unique identifier of the story.

        Returns:
            tuple: A JSON response containing the serialized story and an HTTP status code 200.

        Example:
            GET /api/stories/1
            Response:
            { "id": 1, "title": "Story One", "description": "..." }
        """
        story = get_story_by_id(id)
        return jsonify(story.serialize()), 200
    
    def put(self, id: int):
        """
        Update an existing story with new data.

        HTTP Method: PUT
        Endpoint: /api/stories/<id>

        Request JSON body:
            {
                "title": "New Title",
                "description": "Updated description",
                ...
            }

        Args:
            id (int): The unique identifier of the story to update.

        Side Effects:
            Updates the story in the database.

        Returns:
            tuple: A JSON response confirming the update and an HTTP status code 200.

        Example:
            PUT /api/stories/1
            {
                "title": "New Title",
                "description": "Updated description"
            }
        """
        data = request.get_json()
        update_story(id, data)
        return jsonify({"message": "Story updated"}), 200


class StoryNodesResource(MethodView):
    """
    Resource for managing nodes associated with a specific story.

    Endpoints:
        GET /api/stories/<story_id>/nodes
            Retrieve all nodes for a given story.
        POST /api/stories/<story_id>/nodes
            Create a new node for a given story.
    """
    def get(self, story_id: int):
        """
        Retrieve all nodes associated with a specific story.

        HTTP Method: GET
        Endpoint: /api/stories/<story_id>/nodes

        Args:
            story_id (int): The unique identifier of the story.

        Returns:
            tuple: A JSON response containing a list of nodes (with additional 'next' node IDs) and an HTTP status code 200.

        Example:
            GET /api/stories/1/nodes
            Response:
            {
                "nodes": [
                    {
                        "id": 1,
                        "node_type": "DIALOG",
                        "content": "Hello World",
                        "speaker": "Narrator",
                        "left_img": "path/to/left.png",
                        "right_img": "path/to/right.png",
                        "next": [2, 3]
                    },
                    ...
                ]
            }
        """
        nodes = get_story_nodes(story_id)
        result = [{
            "id": n.id,
            "node_type": n.node_type,
            "content": n.content,
            "speaker": n.speaker,
            "left_img": n.left_img,
            "right_img": n.right_img,
            "background_img": n.background_img,
            "next": get_next_nodes_id(n.id)
        } for n in nodes]
        return jsonify({"nodes": result}), 200

    def post(self, story_id: int):
        """
        Create a new node for a specific story.

        HTTP Method: POST
        Endpoint: /api/stories/<story_id>/nodes

        Request JSON body:
            {
                "node_type": "DIALOG",
                "content": "Node content",
                "speaker": "Speaker",
                "left_img": "path/to/left.png",
                "right_img": "path/to/right.png",
                "background_img": "path/to/background.png"
            }

        Args:
            story_id (int): The unique identifier of the story for which to create the node.

        Side Effects:
            A new node is created in the database.

        Returns:
            tuple: A JSON response containing a success message and the new node's ID, along with an HTTP status code 201.

        Example:
            POST /api/stories/1/nodes
            {
                "content": "New node content",
                "speaker": "Narrator"
            }
            Response:
            {
                "message": "Node created",
                "node_id": 5
            }
        """
        data = request.get_json()
        new_node = create_story_node(story_id, data)
        return jsonify({"message": "Node created", "node_id": new_node.id}), 201


class StoryNodeDetailResource(MethodView):
    """
    Resource for managing an individual node within a story.

    Endpoints:
        GET /api/stories/nodes/<id>
            Retrieve detailed information about a specific node.
        PUT /api/stories/nodes/<id>
            Update an existing node.
        DELETE /api/stories/nodes/<id>
            Delete a node.
    """
    def get(self, id: int) -> object:
        """
        Retrieve detailed information for a specific node in the story graph.

        HTTP Method: GET
        Endpoint: /api/stories/nodes/<id>

        Args:
            id (int): The unique identifier of the node.

        Returns:
            tuple: A JSON response containing the serialized node data and a list of 'next' node IDs,
                   with an HTTP status code 200.

        Example:
            GET /api/stories/nodes/2
            Response:
            {
                "data": {
                    "id": 2,
                    "type": "DIALOG",
                    "content": "Hello",
                    "speaker": "Narrator",
                    "left_img": "path/to/left.png",
                    "right_img": "path/to/right.png",
                    "background_img": "path/to/bg.png"
                },
                "next": [3, 4]
            }
        """
        node_data = get_story_node(id)
        next_nodes = get_next_nodes_id(id)
        return jsonify({"data": node_data, "next": next_nodes}), 200

    def put(self, id: int):
        """
        Update a specific node in the story graph.

        HTTP Method: PUT
        Endpoint: /api/stories/nodes/<id>

        Request JSON body:
            {
                "node_type": "DIALOG",
                "content": "Updated content",
                "speaker": "Updated speaker",
                "left_img": "new/path/to/left.png",
                "right_img": "new/path/to/right.png",
                "background_img": "new/path/to/bg.png"
            }

        Args:
            id (int): The unique identifier of the node to update.

        Side Effects:
            Updates the node in the database.

        Returns:
            tuple: A JSON response confirming the update and an HTTP status code 200.

        Example:
            PUT /api/stories/nodes/2
            {
                "content": "Updated node content"
            }
        """
        data = request.get_json()
        update_story_node(id, data)
        return jsonify({"message": "Node updated"}), 200

    def delete(self, id: int):
        """
        Delete a specific node from the story graph.

        HTTP Method: DELETE
        Endpoint: /api/stories/nodes/<id>

        Args:
            id (int): The unique identifier of the node to delete.

        Side Effects:
            Deletes the node from the database.

        Returns:
            tuple: A JSON response confirming the deletion and an HTTP status code 200.

        Example:
            DELETE /api/stories/nodes/2
            Response:
            { "message": "Node deleted" }
        """
        delete_story_node(id)
        return jsonify({"message": "Node deleted"}), 200


class StoryEdgesResource(MethodView):
    """
    Resource for managing edges between nodes in a story.

    Endpoints:
        GET /api/stories/<story_id>/edges
            Retrieve all edges for a specific story.
        POST /api/stories/<story_id>/edges
            Create a new edge for a story.
        DELETE /api/stories/<story_id>/edges
            Delete an existing edge for a story.
    """
    def get(self, story_id: int):
        """
        Retrieve all edges associated with a specific story.

        HTTP Method: GET
        Endpoint: /api/stories/<story_id>/edges

        Args:
            story_id (int): The unique identifier of the story.

        Returns:
            tuple: A JSON response containing a list of serialized edge objects and an HTTP status code 200.

        Example:
            GET /api/stories/1/edges
            Response:
            {
                "edges": [
                    { "from": 1, "to": 2, "condition": "SUCCESS" },
                    { "from": 2, "to": 3, "condition": "FAIL" }
                ]
            }
        """
        edges = get_story_edges(story_id)
        return jsonify({
            "edges": [edge.serialize() for edge in edges]
        }), 200

    def post(self, story_id: int):
        """
        Create a new edge between nodes in a specific story.

        HTTP Method: POST
        Endpoint: /api/stories/<story_id>/edges

        Request JSON body:
            {
                "from_node_id": <id>,
                "to_node_id": <id>,
                "condition": "SUCCESS"  // Optional, default is "SUCCESS"
            }

        Args:
            story_id (int): The unique identifier of the story. (Note: The story_id might be used for validation purposes.)

        Side Effects:
            Creates a new edge record in the database.

        Returns:
            tuple: A JSON response confirming the creation of the edge and an HTTP status code 201.

        Example:
            POST /api/stories/1/edges
            {
                "from_node_id": 1,
                "to_node_id": 2
            }
        """
        data = request.get_json()
        create_story_edge(data)
        return jsonify({"message": "Edge created"}), 201

    def delete(self, story_id: int):
        """
        Delete an existing edge between nodes in a specific story.

        HTTP Method: DELETE
        Endpoint: /api/stories/<story_id>/edges

        Request JSON body:
            {
                "from_node_id": <id>,
                "to_node_id": <id>
            }

        Args:
            story_id (int): The unique identifier of the story. (Note: This may be used for validation if needed.)

        Side Effects:
            Deletes the specified edge record from the database.

        Returns:
            tuple: A JSON response confirming the deletion of the edge and an HTTP status code 200.

        Example:
            DELETE /api/stories/1/edges
            {
                "from_node_id": 1,
                "to_node_id": 2
            }
        """
        data = request.get_json()
        from_node_id = data["from_node_id"]
        to_node_id = data["to_node_id"]
        delete_story_edge(from_node_id, to_node_id)
        return jsonify({"message": "Edge deleted"}), 200