from flask.views import MethodView
from flask import jsonify, request
from app.services.stories_service import get_story_node, get_next_nodes, get_all_stories, get_story_by_id
from app.models import StoryEdge, StoryNode, Story
from app.extensions import db


class StoriesRessource(MethodView):
    def get(self) -> object:
        """Get all the stories"""
        stories = get_all_stories()
        serialized = [story.serialize() for story in stories]
        return jsonify({ "stories": serialized }), 200


class StoryDetailRessource(MethodView):
    def get(self, id: int) -> object:
        """Get a specific story by ID"""
        story: Story = get_story_by_id(id)
        return jsonify({ "story": story.serialize() }), 200


class StoryNodeDetailRessource(MethodView):
    def get(self, id: int) -> object:
        """Get the details of a node in the story graph"""
        node_data = get_story_node(id)
        next_nodes = get_next_nodes(id)
        return jsonify({ "data": node_data, "next": next_nodes }), 200


class StoryNodesRessource(MethodView):
    def get(self, story_id: int):
        """
        Get all nodes for a given story
        Endpoint: GET /api/stories/<story_id>/nodes
        """
        nodes = StoryNode.query.filter(StoryNode.story_id == story_id).all()
        return jsonify({
            "nodes": [ {
                "id": n.id,
                "node_type": n.node_type,
                "content": n.content,
                "speaker": n.speaker,
                "left_img": n.left_img,
                "right_img": n.right_img,
                # If we store X/Y in the DB, add them here
                "x": None,  # or n.x if you have columns
                "y": None
            } for n in nodes ]
        }), 200

    def post(self, story_id: int):
        """
        Create a new node in a given story
        Endpoint: POST /api/stories/<story_id>/nodes
        Body: { "node_type":..., "content":..., "speaker":..., ... }
        """
        data = request.get_json()
        new_node = StoryNode(
            story_id = story_id,
            node_type = data.get("node_type", "DIALOG"),
            content = data.get("content", ""),
            speaker = data.get("speaker", ""),
            left_img = data.get("left_img", ""),
            right_img = data.get("right_img", "")
        )
        db.session.add(new_node)
        db.session.commit()

        return jsonify({ "message": "Node created", "node_id": new_node.id }), 201


class StoryNodeDetailRessource(MethodView):
    def put(self, id: int):
        """
        Update a node
        Endpoint: PUT /api/stories/nodes/<id>
        Body: { "node_type":..., "content":..., ... }
        """
        node = StoryNode.query.get_or_404(id)
        data = request.get_json()
        node.node_type = data.get("node_type", node.node_type)
        node.content = data.get("content", node.content)
        node.speaker = data.get("speaker", node.speaker)
        node.left_img = data.get("left_img", node.left_img)
        node.right_img = data.get("right_img", node.right_img)
        # If you store x,y in the DB, also update those
        db.session.commit()
        return jsonify({ "message": "Node updated" }), 200

    def delete(self, id: int):
        """
        Delete a node
        Endpoint: DELETE /api/stories/nodes/<id>
        """
        node = StoryNode.query.get_or_404(id)
        db.session.delete(node)
        db.session.commit()
        return jsonify({ "message": "Node deleted" }), 200


class StoryEdgesRessource(MethodView):
    def get(self, story_id: int):
        """
        List edges for a story
        Endpoint: GET /api/stories/<story_id>/edges
        """
        edges = StoryEdge.query.join(StoryNode, StoryEdge.from_node_id == StoryNode.id)\
            .filter(StoryNode.story_id == story_id).all()
        # Alternatively, you might also want edges for which the to_node is part of the story
        # but typically it's the from_node that defines the story
        return jsonify({
            "edges": [ {
                "from": e.from_node_id,
                "to": e.to_node_id,
                "condition": e.condition
            } for e in edges ]
        }), 200

    def post(self, story_id: int):
        """
        Create an edge for this story
        Endpoint: POST /api/stories/<story_id>/edges
        Body: { "from_node_id":..., "to_node_id":..., "condition":... }
        """
        data = request.get_json()
        # you might validate that both from_node and to_node belong to story_id
        new_edge = StoryEdge(
            from_node_id = data["from_node_id"],
            to_node_id = data["to_node_id"],
            condition = data.get("condition", "SUCCESS")
        )
        db.session.add(new_edge)
        db.session.commit()
        return jsonify({ "message": "Edge created" }), 201

    def delete(self, edge_id: int):
        """
        Delete an edge
        Endpoint: DELETE /api/stories/edges/<edge_id>
        You would have to store an 'id' for your edges or handle a composite key differently
        """
        # This may require changes to your StoryEdge model to have a single primary key
        # If you do not have a single primary key, you must handle the deletion differently.
        pass
