from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Project, Image, Layer
from .serializers import (
    ProjectSerializer,
    ImageSerializer,
    ImageUploadSerializer,
    LayerSerializer,
    ProjectCreateSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    @action(detail=False, methods=['post'], url_path='upload')
    def upload_project_with_image(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='images')
    def get_images(self, request, pk=None):
        project = self.get_object()
        images = project.images.all()
        serializer = ImageSerializer(images, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='delete-with-resources')
    def delete_with_resources(self, request, pk=None):
        project = self.get_object()
        project.delete()  # Cascades to images and layers
        return Response({"detail": "Project, images, and layers deleted."}, status=status.HTTP_204_NO_CONTENT)


class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['post'], url_path='upload-to-project')
    def upload_to_project(self, request):
        serializer = ImageUploadSerializer(data=request.data)
        if serializer.is_valid():
            image = serializer.save()
            return Response(ImageSerializer(image).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='layers')
    def get_layers(self, request, pk=None):
        image = self.get_object()
        layers = image.layers.all()
        serializer = LayerSerializer(layers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='delete-with-layers')
    def delete_with_layers(self, request, pk=None):
        image = self.get_object()
        image.delete()
        return Response({"detail": "Image and associated layers deleted."}, status=status.HTTP_204_NO_CONTENT)


class LayerViewSet(viewsets.ModelViewSet):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer
