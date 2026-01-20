"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { HelpCircle, Plus, ThumbsUp, ThumbsDown, Trash2, Loader2, Search } from "lucide-react";

export default function FAQsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "General", status: "active" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["faqs", search],
    queryFn: async () => {
      const res = await apiClient.faqs.getAll({ page: 1, limit: 100, q: search.trim() || undefined });
      return res.data.data;
    },
  });

  const faqs = useMemo(() => data?.faqs ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: () => apiClient.faqs.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ created");
      setIsCreateOpen(false);
      setForm({ question: "", answer: "", category: "General", status: "active" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to create FAQ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.faqs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to delete FAQ"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No FAQ selected");
      return apiClient.faqs.update(editingId, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ updated");
      setIsEditOpen(false);
      setEditingId(null);
      setForm({ question: "", answer: "", category: "General", status: "active" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update FAQ"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQs</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create FAQ</DialogTitle>
              <DialogDescription>Add a new FAQ entry.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Question</Label>
                <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Answer</Label>
                <textarea className="w-full min-h-[140px] border rounded-md p-2" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{faqs.length}</p>
            <p className="text-sm text-muted-foreground">Total FAQs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{faqs.reduce((sum: number, f: any) => sum + (f.helpful || 0), 0)}</p>
            <p className="text-sm text-muted-foreground">Helpful Votes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{faqs.reduce((sum: number, f: any) => sum + (f.notHelpful || 0), 0)}</p>
            <p className="text-sm text-muted-foreground">Not Helpful</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search FAQs..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-sm">{(error as any)?.message || "Failed to load FAQs"}</div>
        ) : null}
        {faqs.map((faq: any) => (
          <Card key={faq._id || faq.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{faq.category}</Badge>
                    <Badge variant={faq.status === "active" ? "default" : "secondary"}>
                      {faq.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{faq.helpful || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <ThumbsDown className="h-4 w-4" />
                    <span>{faq.notHelpful || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(faq._id || faq.id);
                      setForm({
                        question: faq.question || "",
                        answer: faq.answer || "",
                        category: faq.category || "General",
                        status: faq.status || "active",
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const id = faq._id || faq.id;
                      if (window.confirm("Delete this FAQ?")) deleteMutation.mutate(id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update FAQ fields.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Answer</Label>
              <textarea
                className="w-full min-h-[140px] border rounded-md p-2"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsEditOpen(false);
                setEditingId(null);
              }}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

