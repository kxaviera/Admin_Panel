"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Image, Video, File, Music, Upload, Search, Grid, List, Loader2, Trash2 } from "lucide-react";

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", search],
    queryFn: async () => {
      const res = await apiClient.media.getAll({ page: 1, limit: 100, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const mediaItems = useMemo(() => data?.media ?? [], [data]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Select a file");
      const uploadRes = await apiClient.uploads.uploadSingle(file, "media");
      const uploaded = uploadRes.data.data;
      const mime = uploaded.mimetype || file.type;
      const fileType =
        mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "document";
      await apiClient.media.create({
        fileName: uploaded.filename,
        originalName: file.name,
        fileType,
        mimeType: mime,
        fileSize: uploaded.size || file.size,
        url: uploaded.path,
        isPublic: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Uploaded");
      setIsUploadOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.media.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Delete failed"),
  });

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-8 w-8 text-blue-500" />;
      case "video": return <Video className="h-8 w-8 text-purple-500" />;
      case "document": return <File className="h-8 w-8 text-orange-500" />;
      case "audio": return <Music className="h-8 w-8 text-green-500" />;
      default: return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      image: "bg-blue-100 text-blue-800",
      video: "bg-purple-100 text-purple-800",
      document: "bg-orange-100 text-orange-800",
      audio: "bg-green-100 text-green-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage all your files and media</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>Uploads a file and adds it to the media library.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Select file</Label>
              <input ref={fileRef} type="file" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsUploadOpen(false)} disabled={uploadMutation.isPending}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Media ({mediaItems.length})</CardTitle>
              <CardDescription>Browse and manage your media files</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{(error as any)?.message || "Failed to load media"}</div>
          ) : null}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaItems.map((item: any) => (
                <Card key={item._id || item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-3">
                      {getIcon(item.fileType)}
                      <div className="text-center w-full">
                        <p className="font-semibold truncate">{item.originalName || item.fileName}</p>
                        <p className="text-sm text-muted-foreground">{formatSize(item.fileSize)}</p>
                      </div>
                      <Badge className={getTypeBadge(item.fileType)}>{item.fileType}</Badge>
                      <div className="text-xs text-muted-foreground w-full pt-2 border-t">
                        <p>{item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "-"}</p>
                        <div className="flex justify-between items-center pt-2">
                          <a className="text-primary underline text-xs" href={item.url} target="_blank" rel="noreferrer">Open</a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const id = item._id || item.id;
                              if (window.confirm("Delete this media item?")) deleteMutation.mutate(id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mediaItems.map((item: any) => (
                <div
                  key={item._id || item.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {getIcon(item.fileType)}
                    <div>
                      <p className="font-semibold">{item.originalName || item.fileName}</p>
                      <p className="text-sm text-muted-foreground">{item.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getTypeBadge(item.fileType)}>{item.fileType}</Badge>
                    <span className="text-sm text-muted-foreground">{formatSize(item.fileSize)}</span>
                    <span className="text-sm text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : "-"}</span>
                    <a className="text-primary underline text-sm" href={item.url} target="_blank" rel="noreferrer">Open</a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const id = item._id || item.id;
                        if (window.confirm("Delete this media item?")) deleteMutation.mutate(id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

