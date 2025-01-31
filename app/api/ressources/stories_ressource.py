from flask.views import MethodView

class StoriesRessource(MethodView):
    def get(self):
        pass


class StoryDetailRessource(MethodView):
    def get(self, id: int):
        pass
